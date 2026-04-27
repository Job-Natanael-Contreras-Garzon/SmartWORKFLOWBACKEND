import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';
import { AnalyticsService } from '../../core/api/analytics.service';
import { CaseService, Task } from '../../core/api/case.service';
import { DepartmentService } from '../../core/api/department.service';
import { RouterLink } from '@angular/router';

Chart.register(...registerables);

interface Officer {
  id: string;
  name: string;
  tasks: Task[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, DragDropModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styles: [`
    :host { display: block; min-height: 100vh; background: #12131a; color: #e3e1eb; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #444653; border-radius: 10px; }
    .cdk-drop-list-dragging .cdk-drag { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
    .cdk-drag-placeholder { opacity: 0.3; border: 2px dashed #1e40af !important; background: transparent !important; }
  `]
})
export class DashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private caseService = inject(CaseService);
  private deptService = inject(DepartmentService);
  private toastr = inject(ToastrService);
  private auth = inject(AuthService);

  // Charts
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#8e909f', font: { family: 'Inter', size: 10 } } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8e909f' } },
      y: { grid: { color: '#2a2b36' }, ticks: { color: '#8e909f' } }
    }
  };
  
  public bottleneckChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { 
        data: [], 
        label: 'Promedio (h)', 
        backgroundColor: '#1e40af',
        borderRadius: 4
      },
      { 
        data: [], 
        label: 'Vencidas', 
        backgroundColor: '#991b1b',
        borderRadius: 4
      }
    ]
  };

  officers = signal<Officer[]>([]);
  unassignedTasks = signal<Task[]>([]);
  allTaskIds: string[] = ['unassignedList'];

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loadBottlenecks();
    this.loadDepartmentData();
  }

  loadBottlenecks() {
    this.analyticsService.getBottlenecks().subscribe({
      next: (res: any) => {
        const activities = res.activityAnalytics || [];
        this.bottleneckChartData.labels = activities.map((a: any) => a.activityName);
        this.bottleneckChartData.datasets[0].data = activities.map((a: any) => a.avgDurationHours);
        this.bottleneckChartData.datasets[1].data = activities.map((a: any) => a.overdueCount);
      }
    });
  }

  loadDepartmentData() {
    // En un sistema real, deptId se obtiene del perfil del usuario logueado
    // Por ahora simulamos o dejamos que los servicios manejen el contexto
    this.deptService.getDepartmentMembers('placeholder-dept-id').subscribe({
      next: (members: any[]) => {
        const mapped = members.map((m: any) => ({ id: m.id, name: m.name, tasks: [] }));
        this.officers.set(mapped);
        mapped.forEach((o: any) => this.allTaskIds.push('officerList-' + o.id));
        this.loadTasks();
      }
    });
  }

  loadTasks() {
    this.caseService.getTasks().subscribe({
      next: (tasks: Task[]) => {
        this.unassignedTasks.set(tasks.filter((t: Task) => !t.assignedTo));
        const assigned = tasks.filter((t: Task) => t.assignedTo);
        
        const currentOfficers = this.officers();
        currentOfficers.forEach(o => o.tasks = assigned.filter((t: Task) => t.assignedTo?.id === o.id));
        this.officers.set([...currentOfficers]);
      }
    });
  }

  drop(event: CdkDragDrop<Task[]>, targetOfficerId?: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const task = event.container.data[event.currentIndex];
      this.reassignTask(task, targetOfficerId);
    }
  }

  reassignTask(task: Task, targetOfficerId?: string) {
    if (!targetOfficerId) {
      this.toastr.warning('Seleccione un oficial válido');
      return;
    }

    this.caseService.reassignTask(task.caseId, task.id, targetOfficerId).subscribe({
      next: () => {
        this.toastr.success(`Tarea reasignada a ${this.officers().find(o => o.id === targetOfficerId)?.name}`);
      },
      error: () => {
        this.toastr.error('Error en la reasignación');
        this.loadTasks(); // Revert on error
      }
    });
  }
}