import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingStep } from '../../../core/api/tracking.service';

export interface StepperItem {
  stepName: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  department?: string;
  completedAt?: string;
  notes?: string;
  /** Índice 0-based en el flujo total */
  index: number;
  /** Marcar transitoriamente para animación flash */
  isChanging?: boolean;
}

@Component({
  selector: 'app-tracking-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracking-stepper.component.html',
  styleUrls: ['./tracking-stepper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingStepperComponent implements OnChanges {
  @Input() steps: TrackingStep[] = [];
  /** Índice del paso que acaba de cambiar (emitido por TrackComponent) */
  @Input() changedIndex = -1;

  /** Procesado para vista */
  items: StepperItem[] = [];

  /** Índice del paso activo (IN_PROGRESS). -1 si ninguno */
  activeIndex = -1;

  /** Porcentaje de progreso para la barra horizontal */
  progressPct = 0;

  ngOnChanges(changes: SimpleChanges): void {
    // Rebuild items cuando cambian los steps
    if (changes['steps']) {
      this.items = (this.steps ?? []).map((s, i) => ({ ...s, index: i }));
      this.activeIndex = this.items.findIndex(s => s.status === 'IN_PROGRESS');
      const completed = this.items.filter(s => s.status === 'COMPLETED').length;
      this.progressPct =
        this.items.length > 1
          ? Math.round((completed / (this.items.length - 1)) * 100)
          : 0;
    }

    // Activar flash de animación en el paso que cambió
    if (
      changes['changedIndex'] &&
      this.changedIndex >= 0 &&
      this.changedIndex < this.items.length
    ) {
      this.items[this.changedIndex].isChanging = true;
      // El componente usa OnPush; necesitamos una nueva referencia
      this.items = [...this.items];
      // Limpiar la bandera tras la duración de la animación
      setTimeout(() => {
        if (this.items[this.changedIndex]) {
          this.items[this.changedIndex].isChanging = false;
          this.items = [...this.items];
        }
      }, 700);
    }
  }

  trackByIndex(_: number, item: StepperItem): number {
    return item.index;
  }

  /** Label aria para cada estado */
  ariaLabel(item: StepperItem): string {
    switch (item.status) {
      case 'COMPLETED':   return `${item.stepName}: completado`;
      case 'IN_PROGRESS': return `${item.stepName}: en proceso (paso actual)`;
      default:            return `${item.stepName}: pendiente`;
    }
  }
}
