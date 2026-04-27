import { Routes } from '@angular/router';

export const casesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./inbox.component').then(m => m.InboxComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./task-detail.component').then(m => m.TaskDetailComponent)
  }
];
