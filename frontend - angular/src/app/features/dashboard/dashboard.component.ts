import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Task {
  id: string;
  activity: { name: string };
  assignedTo?: { id: string; name: string };
  status: string;
  startedAt: string;
  priority: string;
  workflowCase?: { id: string };
}

interface Officer {
  id: string;
  name: string;
  tasks: Task[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, DragDropModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private auth = inject(AuthService);

  // Charts
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: { min: 0 }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;

  public bottleneckChartData: ChartData<'bar'> = {
    labels: [], // e.g. 'Revision', 'Aprobacion'
    datasets: [
      { data: [], label: 'Tiempo Promedio (Horas)', backgroundColor: 'rgba(255,99,132,0.6)' },
      { data: [], label: 'Tareas Vencidas', backgroundColor: 'rgba(54,162,235,0.6)' }
    ]
  };

  // Drag and Drop (Officers & Unassigned)
  officers: Officer[] = [];
  unassignedTasks: Task[] = [];
  allTaskIds: string[] = ['unassignedList']; // For CDK drop lists connections

  ngOnInit(): void {
    this.loadBottlenecks();
    this.loadDepartmentTasks();
    this.loadDepartmentMembers();
  }

  loadBottlenecks() {
    const deptId = this.auth.getDepartmentId();
    this.http.get<any>(`/api/analytics/bottlenecks?departmentId=${deptId}`).subscribe({
      next: (res) => {
        const activities = res.activityAnalytics || [];
        this.bottleneckChartData.labels = activities.map((a: any) => a.activityName);
        this.bottleneckChartData.datasets[0].data = activities.map((a: any) => a.avgDurationHours);
        this.bottleneckChartData.datasets[1].data = activities.map((a: any) => a.overdueCount);
      }
    });
  }

  loadDepartmentMembers() {
    const deptId = this.auth.getDepartmentId();
    if (!deptId) return;

    this.http.get<any[]>(`/api/departments/${deptId}/members`).subscribe({
      next: (members) => {
        this.officers = members.map(m => ({ id: m.id, name: m.name, tasks: [] }));
        this.officers.forEach(o => this.allTaskIds.push('officerList-' + o.id));
        this.distributeTasks();
      }
    });
  }

  loadDepartmentTasks() {
    this.http.get<Task[]>('/api/cases/department-tasks?status=PENDING').subscribe({
      next: (tasks) => {
        this.unassignedTasks = tasks.filter(t => !t.assignedTo);
        const assigned = tasks.filter(t => t.assignedTo);
        
        // This acts as a cache, we map them into officers when officers load
        this.distributeTasks(assigned);
      }
    });
  }

  private pendingAssignments: Task[] = [];
  distributeTasks(tasks?: Task[]) {
    if (tasks) this.pendingAssignments = tasks;
    if (this.officers.length === 0) return; // Wait for officers

    this.officers.forEach(o => o.tasks = []);
    this.pendingAssignments.forEach(t => {
      const officer = this.officers.find(o => o.id === t.assignedTo?.id);
      if (officer) {
        officer.tasks.push(t);
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
      this.toastr.warning('No se puede desasignar por drag & drop aún');
      // Here we might need a desassign API if needed.
      return;
    }

    const payload = {
      targetUserId: targetOfficerId,
      reason: 'Reasignado vía Drag&Drop por el Manager'
    };

    // API expects: PUT /{caseId}/tokens/{tokenId}/reassign
    // Assuming task model has case ID or backend can infer from tokenId. 
    // Wait, the backend endpoint requires caseId! 
    const caseId = (task as any).workflowCase?.id || task.id; // placeholder: adjust according to your DTO
    
    this.http.put(`/api/cases/${caseId}/tokens/${task.id}/reassign`, payload).subscribe({
      next: () => {
        this.toastr.success(`Tarea reasignada a nuevo oficial`);
      },
      error: () => {
        this.toastr.error('Error reasignando la tarea');
      }
    });
  }
}