import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  // ── SUPER_ADMIN: gestión global del sistema ──────────────────
  {
    path: 'super-admin',
    loadComponent: () => import('./features/super-admin/super-admin-dashboard.component').then(m => m.SuperAdminDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN'] }
  },
  // ── ADMIN: gestión de la organización ────────────────────────
  {
    path: 'admin',
    loadChildren: () => import('./features/users/users.routes').then(m => m.usersRoutes),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/policy-editor',
    loadChildren: () => import('./features/policy-editor/policy.routes').then(m => m.policyRoutes),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'MANAGER'] }
  },
  // ── MANAGER: dashboard departamental ─────────────────────────
  {
    path: 'manager',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
    canActivate: [roleGuard],
    data: { roles: ['MANAGER'] }
  },
  // ── OFFICER: gestión de casos ────────────────────────────────
  {
    path: 'officer',
    loadChildren: () => import('./features/cases/cases.routes').then(m => m.casesRoutes),
    canActivate: [roleGuard],
    data: { roles: ['OFFICER'] }
  },
  // ── PUBLIC: tracking page — no login required ────────────────
  {
    path: 'track',
    loadChildren: () => import('./features/track/track.routes').then(m => m.trackRoutes),
  },
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./core/auth/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '',
    loadComponent: () => import('./features/bpm-landing/bpm-landing.component').then(m => m.BpmLandingComponent)
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
