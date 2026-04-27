import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { TrackingResult } from './tracking.service';

export type SseConnectionState = 'connecting' | 'open' | 'closed' | 'error';

@Injectable({ providedIn: 'root' })
export class SseTrackingService {
  private eventSource: EventSource | null = null;

  constructor(private zone: NgZone) {}

  /**
   * Abre un stream SSE en /api/public/track/{code}/events
   * Emite TrackingResult cada vez que el backend envía un evento "update".
   * Cierra la conexión anterior si existía.
   */
  watch(trackingCode: string): Observable<TrackingResult> {
    return new Observable<TrackingResult>(observer => {
      // Cerrar stream previo
      this.close();

      const url = `/api/public/track/${trackingCode.trim().toUpperCase()}/events`;
      const es = new EventSource(url);
      this.eventSource = es;

      // Evento nombrado "update" enviado por el backend
      es.addEventListener('update', (event: MessageEvent) => {
        this.zone.run(() => {
          try {
            const data: TrackingResult = JSON.parse(event.data);
            observer.next(data);

            // Cerrar el stream automáticamente cuando el trámite termina
            if (
              data.currentStatus === 'COMPLETED' ||
              data.currentStatus === 'REJECTED'
            ) {
              this.close();
              observer.complete();
            }
          } catch {
            // Dato malformado — ignorar sin romper el stream
          }
        });
      });

      // Evento genérico (data sin nombre de evento)
      es.onmessage = (event: MessageEvent) => {
        this.zone.run(() => {
          try {
            const data: TrackingResult = JSON.parse(event.data);
            observer.next(data);
          } catch { /* ignorar */ }
        });
      };

      es.onerror = () => {
        this.zone.run(() => {
          // EventSource se reconecta automáticamente; solo notificamos si
          // el estado ya es CLOSED (error definitivo)
          if (es.readyState === EventSource.CLOSED) {
            observer.error(new Error('SSE connection closed by server'));
          }
        });
      };

      // Cleanup cuando el observable se cancela (destroy del componente)
      return () => this.close();
    });
  }

  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
