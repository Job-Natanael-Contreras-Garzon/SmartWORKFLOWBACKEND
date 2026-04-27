import { Routes } from '@angular/router';

export const policyRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./policy-editor.component').then(m => m.PolicyEditorComponent)
  },
  {
    path: 'forms',
    loadComponent: () => import('./form-builder/form-builder.component').then(m => m.FormBuilderComponent)
  }
];
