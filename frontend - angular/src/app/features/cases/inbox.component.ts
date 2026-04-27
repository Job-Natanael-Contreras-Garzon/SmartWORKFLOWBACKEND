import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CaseService, Task } from '../../core/api/case.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-[#12131a] text-[#e3e1eb] font-sans h-screen flex overflow-hidden antialiased">
      <!-- SideNavBar -->
      <aside class="bg-[#0d0e14] border-r border-[#444653] w-64 h-screen sticky left-0 top-0 flex flex-col py-6 space-y-2 z-20 flex-shrink-0">
        <div class="px-6 mb-8">
          <h2 class="text-[#b8c4ff] font-bold uppercase tracking-[0.1em] text-sm">Management</h2>
          <p class="text-[#8e909f] text-[11px] mt-1 font-medium">Enterprise Console</p>
        </div>
        
        <nav class="flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar">
          <a class="text-[#c4c5d5] hover:bg-[#1a1b22] transition-colors flex items-center gap-3 px-3 py-2.5 rounded-[8px] group" routerLink="/manager">
            <span class="material-symbols-outlined text-[22px] text-[#8e909f] group-hover:text-[#b8c4ff]">dashboard</span>
            <span class="text-sm font-medium">Overview</span>
          </a>
          <a class="text-[#c4c5d5] hover:bg-[#1a1b22] transition-colors flex items-center gap-3 px-3 py-2.5 rounded-[8px] group" routerLink="/admin/policy-editor">
            <span class="material-symbols-outlined text-[22px] text-[#8e909f] group-hover:text-[#b8c4ff]">account_tree</span>
            <span class="text-sm font-medium">Policy Editor</span>
          </a>
          <a class="bg-[#1e1f26] text-[#b8c4ff] border-l-[3px] border-[#1e40af] flex items-center gap-3 px-3 py-2.5 rounded-r-[8px] shadow-md" routerLink="/officer">
            <span class="material-symbols-outlined text-[22px]">assignment_turned_in</span>
            <span class="text-sm font-semibold">Task Manager</span>
          </a>
          <a class="text-[#c4c5d5] hover:bg-[#1a1b22] transition-colors flex items-center gap-3 px-3 py-2.5 rounded-[8px] group" routerLink="/manager">
            <span class="material-symbols-outlined text-[22px] text-[#8e909f] group-hover:text-[#b8c4ff]">leaderboard</span>
            <span class="text-sm font-medium">Analytics</span>
          </a>
          <a class="text-[#c4c5d5] hover:bg-[#1a1b22] transition-colors flex items-center gap-3 px-3 py-2.5 rounded-[8px] group" routerLink="/admin">
            <span class="material-symbols-outlined text-[22px] text-[#8e909f] group-hover:text-[#b8c4ff]">settings_applications</span>
            <span class="text-sm font-medium">Administration</span>
          </a>
        </nav>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 bg-[#12131a]">
        <header class="bg-[#1a1b22] border-b border-[#444653] flex items-center justify-between px-8 h-16 w-full z-10 flex-shrink-0">
          <div class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span class="w-2 h-6 bg-[#1e40af] rounded-full"></span>
            Inbox de Tareas
          </div>
          <div class="flex items-center gap-4 text-[#8e909f] text-xs font-bold uppercase tracking-widest">
            Pendientes: {{ tasks().length }}
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div class="max-w-6xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (task of tasks(); track task.id) {
                <div class="bg-[#1e1f26] border border-[#444653] rounded-[8px] p-6 hover:border-[#1e40af] transition-all cursor-pointer relative overflow-hidden shadow-lg group"
                     (click)="goToDetail(task.id)">
                  
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#1e40af]"></div>

                  <div class="flex justify-between items-start mb-4">
                    <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[4px]"
                          [ngClass]="task.priority === 'HIGH' ? 'bg-[#991b1b]/20 text-[#ffb4ab]' : 'bg-[#1e40af]/20 text-[#b8c4ff]'">
                      {{ task.priority }}
                    </span>
                    <span class="text-[10px] font-mono text-[#8e909f]">#{{ task.id.substring(0,8) }}</span>
                  </div>

                  <h3 class="text-lg font-bold text-white mb-2 leading-tight group-hover:text-[#b8c4ff] transition-colors">
                    {{ task.activity.name }}
                  </h3>
                  <p class="text-xs text-[#8e909f] mb-6 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[14px]">calendar_today</span>
                    {{ task.startedAt | date:'MMM dd, HH:mm' }}
                  </p>

                  <div class="pt-4 border-t border-[#444653]/50 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-[#1e40af] flex items-center justify-center text-[10px] font-bold">
                        {{ task.assignedTo?.name?.charAt(0) }}
                      </div>
                      <span class="text-[11px] font-medium text-[#c4c5d5]">{{ task.assignedTo?.name }}</span>
                    </div>
                    <button class="text-[#1e40af] hover:text-[#b8c4ff] transition-colors">
                      <span class="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                </div>
              }
              @if (tasks().length === 0 && !isLoading()) {
                <div class="col-span-full py-20 text-center flex flex-col items-center gap-4 opacity-50">
                  <span class="material-symbols-outlined text-6xl">inbox</span>
                  <p class="text-sm font-medium">No hay tareas pendientes en tu bandeja.</p>
                </div>
              }
              @if (isLoading()) {
                <div class="col-span-full py-20 text-center">
                  <div class="w-8 h-8 border-4 border-[#1e40af]/30 border-t-[#1e40af] rounded-full animate-spin mx-auto"></div>
                </div>
              }
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #444653; border-radius: 10px; }
  `]
})
export class InboxComponent implements OnInit {
  private caseService = inject(CaseService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  tasks = signal<Task[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.isLoading.set(true);
    this.caseService.getTasks().subscribe({
      next: (data: Task[]) => {
        this.tasks.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Error al sincronizar bandeja');
        this.isLoading.set(false);
      }
    });
  }

  goToDetail(taskId: string) {
    this.router.navigate(['/officer', taskId]);
  }
}
