import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingEta, StepEtaInfo } from '../../../core/api/tracking.service';

@Component({
  selector: 'app-eta-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eta-card.component.html',
  styleUrls: ['./eta-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EtaCardComponent implements OnChanges {
  @Input() eta!: TrackingEta;
  @Input() isLoading = false;

  current: StepEtaInfo | null = null;
  showTable = false;

  /** Porcentaje de tiempo transcurrido vs promedio (0-100+) */
  elapsedPct = 0;
  /** Horas transcurridas desde que entró al paso actual */
  elapsedHours = 0;
  /** true si ya superó el tiempo promedio */
  isOverdue = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eta'] && this.eta) {
      this.current = this.eta.currentStep ?? null;
      this.recalcProgress();
    }
  }

  private recalcProgress(): void {
    if (!this.current?.enteredAt || !this.current.avgDurationHours) {
      this.elapsedPct  = 0;
      this.elapsedHours = 0;
      this.isOverdue   = false;
      return;
    }
    const enteredMs = new Date(this.current.enteredAt).getTime();
    this.elapsedHours = (Date.now() - enteredMs) / 3_600_000;
    const raw = (this.elapsedHours / this.current.avgDurationHours) * 100;
    this.elapsedPct  = Math.min(raw, 100);
    this.isOverdue   = this.elapsedHours > this.current.avgDurationHours;
  }

  /** Formatea horas en texto legible: "2 días", "4 horas", "1 día y 3 horas" */
  formatHours(hours: number): string {
    if (!hours || hours < 0) return '—';
    const days  = Math.floor(hours / 24);
    const hrs   = Math.round(hours % 24);

    if (days === 0) return hrs === 1 ? '1 hora'  : `${hrs} horas`;
    if (hrs  === 0) return days === 1 ? '1 día'   : `${days} días`;
    const d = days === 1 ? '1 día'  : `${days} días`;
    const h = hrs  === 1 ? '1 hora' : `${hrs} horas`;
    return `${d} y ${h}`;
  }

  /** Tiempo restante estimado en el paso actual */
  get remainingInCurrentStep(): string {
    if (!this.current?.avgDurationHours) return '—';
    const rem = this.current.avgDurationHours - this.elapsedHours;
    if (rem <= 0) return 'Más tiempo del esperado';
    return this.formatHours(rem);
  }

  /** Urgency class para el progress bar */
  progressClass(): string {
    if (this.isOverdue)     return 'progress--overdue';
    if (this.elapsedPct > 75) return 'progress--warn';
    return 'progress--ok';
  }

  /** Devuelve solo los pasos con promedios conocidos */
  get stepsWithData(): StepEtaInfo[] {
    return (this.eta?.steps ?? []).filter(s => s.avgDurationHours > 0);
  }
}
