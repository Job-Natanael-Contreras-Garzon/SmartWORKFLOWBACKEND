import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject, filter, take, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * Agrega el header Authorization: Bearer <token> a cada petición HTTP
 * que tenga un token de acceso en localStorage.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true   // necesario para que el browser envíe la cookie de refresh
    });
  }

  return next(req);
};

// Flag para evitar múltiples refresh simultáneos
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<boolean>(false);

/**
 * Intercepta errores 401 e intenta renovar el accessToken automáticamente
 * usando la cookie HttpOnly de refreshToken enviada por el backend.
 * Si el refresh también falla, hace logout.
 */
export const refreshInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Sólo actuar en 401 y cuando NO sea la petición de refresh (para evitar loop)
      const isRefreshCall = req.url.includes('/api/auth/refresh');
      if (error.status !== 401 || isRefreshCall) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        // Esperar a que termine el refresh en curso y reintentar
        return refreshDone$.pipe(
          filter(done => done),
          take(1),
          switchMap(() => {
            const newToken = authService.getToken();
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
              withCredentials: true
            });
            return next(retried);
          })
        );
      }

      isRefreshing = true;
      refreshDone$.next(false);

      return authService.refreshToken().pipe(
        switchMap(() => {
          isRefreshing = false;
          refreshDone$.next(true);
          const newToken = authService.getToken();
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
            withCredentials: true
          });
          return next(retried);
        }),
        catchError((refreshError) => {
          isRefreshing = false;
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
