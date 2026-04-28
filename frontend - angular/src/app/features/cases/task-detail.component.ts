import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CaseService, Task } from '../../core/api/case.service';

interface FormFieldSchema {
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file';
  name: string;
  label: string;
  required?: boolean;
  options?: string[]; // for select
}

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './task-detail.component.html'
})
export class TaskDetailComponent implements OnInit {
  taskId: string = '';
  dynamicForm!: FormGroup;

  task = signal<Task | null>(null);
  isLoading = signal(false);
  notFound = false;

  modalOpen = false;
  modalAction: 'complete' | 'reject' = 'complete';
  modalNote = '';
  isSubmitting = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Mock form schema coming from backend JSON schema
  formSchema: FormFieldSchema[] = [
    { type: 'textarea', name: 'comments', label: 'Comentarios de Revisión', required: true },
    { type: 'select', name: 'decision', label: 'Decisión Analítica', required: true, options: ['Aprobar y continuar', 'Rechazar por falta de fondos', 'Solicitar correcciones'] },
    { type: 'checkbox', name: 'verified', label: 'Documentación verificada' },
    { type: 'date', name: 'nextReview', label: 'Fecha objetivo ejecución', required: true },
    { type: 'file', name: 'attachment', label: 'Adjuntar dictamen (Opcional)' }
  ];

  // Mock Timeline history
  timeline = [
    { date: '18 Oct, 09:00', title: 'Radicación Inicial', actor: 'Ana Martínez (Solicitante)', comments: null },
    { date: '19 Oct, 11:30', title: 'Revisión Área Legal', actor: 'Carlos Vega (Officer Legal)', comments: 'Los términos se ajustan a política v3.' },
    { date: '20 Oct, 14:15', title: 'Asignación Manual', actor: 'Sistema', comments: 'Enrutado al equipo directivo.' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private caseService: CaseService
  ) {}

  ngOnInit() {
    this.taskId = this.route.snapshot.paramMap.get('id') || '';
    this.buildDynamicForm();
    this.loadTask();
  }

  loadTask() {
    if (!this.taskId) {
      this.notFound = true;
      return;
    }
    this.isLoading.set(true);
    this.caseService.getTasks().subscribe({
      next: (data: any) => {
        const tasks: Task[] = Array.isArray(data) ? data : (data.content || []);
        const found = tasks.find((t: Task) => t.id === this.taskId);
        if (found) {
          this.task.set(found);
          this.isLoading.set(false);
        } else {
          // Fallback: try department tasks
          this.caseService.getDepartmentTasks().subscribe({
            next: (deptTasks: Task[]) => {
              const deptFound = deptTasks.find((t: Task) => t.id === this.taskId);
              if (deptFound) {
                this.task.set(deptFound);
              } else {
                this.notFound = true;
              }
              this.isLoading.set(false);
            },
            error: () => {
              this.notFound = true;
              this.isLoading.set(false);
            }
          });
        }
      },
      error: () => {
        this.notFound = true;
        this.isLoading.set(false);
      }
    });
  }

  buildDynamicForm() {
    const group: any = {};
    for (const field of this.formSchema) {
      if (field.type === 'checkbox') {
         group[field.name] = [false, field.required ? Validators.requiredTrue : null];
      } else {
         group[field.name] = ['', field.required ? Validators.required : null];
      }
    }
    this.dynamicForm = this.fb.group(group);
  }

  isInvalid(fieldName: string): boolean {
    const control = this.dynamicForm.get(fieldName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onFileChange(event: any, fieldName: string) {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.dynamicForm.patchValue({ [fieldName]: fileList[0].name });
    }
  }

  openModal(action: 'complete' | 'reject') {
    if (action === 'reject') return; // Reject is disabled
    if (action === 'complete' && this.dynamicForm.invalid) {
      this.dynamicForm.markAllAsTouched();
      return;
    }
    this.modalAction = action;
    this.modalNote = '';
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.modalNote = '';
  }

  confirmAction() {
    const currentTask = this.task();
    if (!currentTask) return;

    this.isSubmitting = true;

    const payload = {
      ...this.dynamicForm.value,
      notes: this.modalNote
    };

    this.caseService.completeTask(currentTask.caseId, currentTask.id, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.modalOpen = false;
        this.displayToast('Tarea completada exitosamente', 'success');
        setTimeout(() => {
          this.router.navigate(['/officer']);
        }, 1500);
      },
      error: () => {
        this.isSubmitting = false;
        this.modalOpen = false;
        this.displayToast('Error al completar la tarea. Intente nuevamente.', 'error');
      }
    });
  }

  displayToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
  }

  goBack() {
    this.router.navigate(['/officer']);
  }
}
