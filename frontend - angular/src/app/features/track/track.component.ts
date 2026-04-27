import {
  Component,
  signal,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import {
  TrackingService,
  TrackingResult,
  TrackingEta,
} from '../../core/api/tracking.service';
import { SseTrackingService } from '../../core/api/sse-tracking.service';
import { TrackingStepperComponent } from './tracking-stepper/tracking-stepper.component';
import { EtaCardComponent } from './eta-card/eta-card.component';
import * as QRCode from 'qrcode';

/** Formato esperado: SW-YYYYMMDD-XXXXXX */
const TRACKING_CODE_REGEX = /^SW-\d{8}-[A-Z0-9]{6}$/i;

type SearchState = 'idle' | 'loading' | 'found' | 'not_found' | 'error';

/* ── Confetti particle ───────────────────────────────────────── */
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

const CONFETTI_COLORS = [
  '#22c55e', '#86efac', '#fbbf24', '#f59e0b',
  '#60a5fa', '#a78bfa', '#f472b6', '#fff',
];

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TrackingStepperComponent, EtaCardComponent],
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.css'],
})
export class TrackComponent implements OnInit, OnDestroy {
  @ViewChild('confettiCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  /* ── Form state ── */
  trackingCode = '';
  state = signal<SearchState>('idle');
  result = signal<TrackingResult | null>(null);
  errorMessage = signal<string>('');
  formatError = signal<string>('');

  /* ── SSE/live state ── */
  sseActive = signal(false);
  sseError  = signal(false);
  /** Índice del paso que acaba de cambiar → stepper lo anima */
  changedStepIndex = signal<number>(-1);
  /** Trámite completado → mostrar celebración */
  isCompleted = signal(false);
  /** PDF en descarga */
  downloading = signal(false);
  /** Datos ETA del BottleneckAnalyzer */
  eta = signal<TrackingEta | null>(null);
  etaLoading = signal(false);
  /** Modal QR */
  qrCodeUrl = signal<string | null>(null);

  private sseSub?: Subscription;
  private etaSub?: Subscription;
  private confettiRaf?: number;

  constructor(
    private trackingService: TrackingService,
    private sseTrackingService: SseTrackingService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Si viene el código en la URL (ej: /track?code=SW-20240424-AB12CD), lo autocompleta y busca
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.trackingCode = code;
        this.search();
      }
    });
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  GETTERS                                                      */
  /* ──────────────────────────────────────────────────────────── */

  get isLoading(): boolean { return this.state() === 'loading'; }

  /* ──────────────────────────────────────────────────────────── */
  /*  FORMAT VALIDATION                                            */
  /* ──────────────────────────────────────────────────────────── */

  validateFormat(): boolean {
    const code = this.trackingCode.trim();
    if (!code) {
      this.formatError.set('Por favor ingresa el código de seguimiento.');
      return false;
    }
    if (!TRACKING_CODE_REGEX.test(code)) {
      this.formatError.set(
        'Formato inválido. El código debe tener la forma SW-YYYYMMDD-XXXXXX (ej. SW-20240424-AB12CD).'
      );
      return false;
    }
    this.formatError.set('');
    return true;
  }

  onInputChange(): void {
    if (this.formatError()) this.validateFormat();
    if (this.state() !== 'idle') this.state.set('idle');
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  SEARCH (HTTP)                                                */
  /* ──────────────────────────────────────────────────────────── */

  search(): void {
    if (!this.validateFormat()) return;

    this.stopSse();
    this.state.set('loading');
    this.result.set(null);
    this.errorMessage.set('');
    this.isCompleted.set(false);
    this.sseError.set(false);

    this.trackingService.search(this.trackingCode).subscribe({
      next: (data) => {
        this.result.set(data);
        this.state.set('found');
        this.fetchEta(data.trackingCode);

        if (data.currentStatus === 'COMPLETED') {
          this.isCompleted.set(true);
          this.launchConfetti();
        } else {
          this.startSse(data.trackingCode);
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.state.set('not_found');
        } else {
          this.errorMessage.set(
            'Ocurrió un problema al consultar el trámite. Intenta de nuevo más tarde.'
          );
          this.state.set('error');
        }
      },
    });
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  SSE — REAL-TIME UPDATES                                      */
  /* ──────────────────────────────────────────────────────────── */

  private startSse(code: string): void {
    this.sseActive.set(true);

    this.sseSub = this.sseTrackingService.watch(code).subscribe({
      next: (update) => this.applyUpdate(update),
      error: () => {
        this.sseActive.set(false);
        this.sseError.set(true);
      },
      complete: () => this.sseActive.set(false),
    });
  }

  private stopSse(): void {
    this.sseSub?.unsubscribe();
    this.sseSub = undefined;
    this.sseTrackingService.close();
    this.sseActive.set(false);
  }

  /**
   * Aplica la actualización del backend al estado local.
   * Detecta qué paso cambió de estado para que el stepper lo anime.
   */
  private applyUpdate(update: TrackingResult): void {
    const prev = this.result();
    if (prev) {
      // Encontrar el primer paso cuyo status difiere
      const changed = update.steps.findIndex(
        (s, i) => prev.steps[i]?.status !== s.status
      );
      this.changedStepIndex.set(changed);
      // Reset del índice tras la animación (300 ms)
      setTimeout(() => this.changedStepIndex.set(-1), 600);

      // Re-fetch ETA cuando cambia el departamento activo
      if (prev.currentDepartment !== update.currentDepartment) {
        this.fetchEta(update.trackingCode);
      }
    }

    this.result.set(update);

    if (update.currentStatus === 'COMPLETED') {
      this.isCompleted.set(true);
      this.stopSse();
      this.eta.set(null); // ocultar ETA cuando está completo
      // Dar tiempo al DOM para renderizar el canvas antes del confetti
      setTimeout(() => this.launchConfetti(), 80);
    }
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  ETA — BOTTLENECK ANALYZER                                   */
  /* ──────────────────────────────────────────────────────────── */

  private fetchEta(code: string): void {
    this.etaLoading.set(true);
    this.etaSub?.unsubscribe();
    this.etaSub = this.trackingService.getEta(code).subscribe({
      next:  (data) => { this.eta.set(data); this.etaLoading.set(false); },
      error: ()     => { this.etaLoading.set(false); }, // ETA es opcional; falla silenciosa
    });
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  CONFETTI                                                     */
  /* ──────────────────────────────────────────────────────────── */

  private launchConfetti(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      r: 5 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.08; // gravity
        p.rotation += p.rotationSpeed;
        if (p.y < canvas.height + 40) { alive = true; p.alpha -= 0.004; }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      }

      if (alive) {
        this.confettiRaf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    this.confettiRaf = requestAnimationFrame(draw);
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  PDF DOWNLOAD                                                 */
  /* ──────────────────────────────────────────────────────────── */

  downloadPdf(): void {
    if (this.downloading()) return;
    const code = this.result()?.trackingCode;
    if (!code) return;

    this.downloading.set(true);

    // Abre la URL de descarga directa en nueva pestaña
    // El backend sirve el PDF en /api/public/track/{code}/certificate
    const url = `/api/public/track/${code}/certificate`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-${code}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => this.downloading.set(false), 2000);
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  QR CODE                                                      */
  /* ──────────────────────────────────────────────────────────── */

  async openQrModal(): Promise<void> {
    const code = this.result()?.trackingCode;
    if (!code) return;

    // Generar la URL absoluta que se compartirá
    const trackingUrl = `${window.location.origin}/track?code=${code}`;

    try {
      const dataUrl = await QRCode.toDataURL(trackingUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      this.qrCodeUrl.set(dataUrl);
    } catch (err) {
      console.error('Error generando QR', err);
    }
  }

  closeQrModal(): void {
    this.qrCodeUrl.set(null);
  }

  downloadQr(): void {
    const url = this.qrCodeUrl();
    const code = this.result()?.trackingCode;
    if (!url || !code) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  HELPERS                                                      */
  /* ──────────────────────────────────────────────────────────── */

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      SUBMITTED:   'Enviado',
      IN_PROGRESS: 'En Proceso',
      COMPLETED:   'Completado',
      REJECTED:    'Rechazado',
      ON_HOLD:     'En Espera',
      PENDING:     'Pendiente',
    };
    return map[status] ?? status;
  }

  /* ──────────────────────────────────────────────────────────── */
  /*  LIFECYCLE                                                    */
  /* ──────────────────────────────────────────────────────────── */

  ngOnDestroy(): void {
    this.stopSse();
    this.etaSub?.unsubscribe();
    if (this.confettiRaf) cancelAnimationFrame(this.confettiRaf);
  }
}
