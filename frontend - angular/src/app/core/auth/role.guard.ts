import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as Array<string>;
  if (!authService.getToken()) {
    return router.parseUrl('/login');
  }

  // SUPER_ADMIN tiene acceso a todo
  if (authService.isSuperAdmin()) {
    return true;
  }

  // ADMIN tiene acceso a las rutas que incluyan ADMIN o roles inferiores
  if (expectedRoles && !authService.hasRole(expectedRoles) && !authService.hasRole(['ADMIN'])) {
    return router.parseUrl('/unauthorized');
  }

  return true;
};
