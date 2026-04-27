import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface OfficerTask {
  id: string;
  transactionName: string;
  applicant: string;
  startDate: Date;
  slaHoursTotal: number;
  elapsedHours: number;
  status: 'RECIÉN LLEGADO' | 'EN PROCESO' | 'COMPLETADO';
}

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <div class="max-w-5xl mx-auto">
        <header class="mb-8 flex justify-between items-end">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Bandeja de Tareas</h1>
            <p class="text-sm text-gray-500 mt-1">Gestione sus trámites asignados según prioridad y SLA.</p>
          </div>
          <div class="text-sm bg-white border px-3 py-1.5 rounded-full shadow-sm font-medium text-gray-600">
            Total pendientes: {{ pendingTasksCount }}
          </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let task of sortedTasks" 
               class="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
               (click)="goToDetail(task.id)">
            
            <!-- Side accent color based on urgency -->
            <div class="absolute left-0 top-0 bottom-0 w-1.5" [ngClass]="getUrgencyColor(task)"></div>

            <div class="flex justify-between items-start mb-3">
              <span class="text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide" [ngClass]="getStatusTagClass(task.status)">
                <span class="mr-1">{{ getStatusIcon(task.status) }}</span> {{ task.status }}
              </span>
              <span class="text-xs text-gray-400 font-medium whitespace-nowrap">{{ task.id }}</span>
            </div>

            <h3 class="font-bold text-lg text-gray-800 mb-1 leading-tight">{{ task.transactionName }}</h3>
            <p class="text-sm text-gray-600 mb-4 whitespace-nowrap overflow-hidden text-ellipsis">
              <span class="font-medium">Solicitante:</span> {{ task.applicant }}
            </p>

            <div class="mt-auto">
              <div class="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                <span>{{ task.startDate | date:'MMM d, HH:mm' }}</span>
                <span [ngClass]="{'text-red-600 font-bold': isSLABreached(task)}">
                  {{ getRemainingHours(task) }}h restantes
                </span>
              </div>
              <!-- ProgressBar SLA -->
              <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div class="h-2 rounded-full transition-all duration-500" 
                     [style.width.%]="getSLAProgress(task)" 
                     [ngClass]="getProgressBarColor(task)">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="sortedTasks.length === 0" class="text-center py-12 text-gray-500">
          <span class="text-4xl block mb-3">☕</span>
          <p>No tiene tareas pendientes en su bandeja.</p>
        </div>

      </div>
    </div>
  `
})
export class InboxComponent implements OnInit {
  tasks: OfficerTask[] = [
    { id: 'TRX-1049', transactionName: 'Revisión de Gastos Q3', applicant: 'Ana Martínez', startDate: new Date(Date.now() - 2 * 3600000), slaHoursTotal: 24, elapsedHours: 2, status: 'RECIÉN LLEGADO' },
    { id: 'TRX-1055', transactionName: 'Aprobación de Contrato Proveedor', applicant: 'Carlos Sánchez', startDate: new Date(Date.now() - 40 * 3600000), slaHoursTotal: 48, elapsedHours: 40, status: 'EN PROCESO' },
    { id: 'TRX-1062', transactionName: 'Solicitud de Vacaciones', applicant: 'Luisa López', startDate: new Date(Date.now() - 10 * 3600000), slaHoursTotal: 12, elapsedHours: 10, status: 'EN PROCESO' },
    { id: 'TRX-1002', transactionName: 'Baja de Activo Fijo', applicant: 'Pedro Gómez', startDate: new Date(Date.now() - 8 * 3600000), slaHoursTotal: 8, elapsedHours: 9, status: 'EN PROCESO' }, // SLA Breached
  ];

  sortedTasks: OfficerTask[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.sortTasks();
  }

  get pendingTasksCount(): number {
    return this.tasks.filter(t => t.status !== 'COMPLETADO').length;
  }

  sortTasks() {
    // Sort by Urgency (least remaining hours first)
    this.sortedTasks = [...this.tasks].sort((a, b) => {
      const aRemaining = a.slaHoursTotal - a.elapsedHours;
      const bRemaining = b.slaHoursTotal - b.elapsedHours;
      return aRemaining - bRemaining;
    });
  }

  getRemainingHours(task: OfficerTask): number {
    return Math.max(0, task.slaHoursTotal - task.elapsedHours);
  }

  isSLABreached(task: OfficerTask): boolean {
    return task.elapsedHours >= task.slaHoursTotal;
  }

  getSLAProgress(task: OfficerTask): number {
    const progress = (task.elapsedHours / task.slaHoursTotal) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  getProgressBarColor(task: OfficerTask): string {
    const progress = this.getSLAProgress(task);
    if (progress >= 100) return 'bg-red-600';
    if (progress > 75) return 'bg-orange-500';
    return 'bg-blue-500';
  }

  getUrgencyColor(task: OfficerTask): string {
    const remaining = this.getRemainingHours(task);
    if (remaining === 0) return 'bg-red-600';
    if (remaining <= 4) return 'bg-orange-500';
    return 'bg-blue-500';
  }

  getStatusTagClass(status: string): string {
    switch (status) {
      case 'RECIÉN LLEGADO': return 'bg-red-50 text-red-700 border border-red-200';
      case 'EN PROCESO': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'COMPLETADO': return 'bg-green-50 text-green-700 border border-green-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'RECIÉN LLEGADO': return '🔴';
      case 'EN PROCESO': return '🟡';
      case 'COMPLETADO': return '🟢';
      default: return '⚪';
    }
  }

  goToDetail(taskId: string) {
    this.router.navigate(['/officer', taskId]);
  }
}
