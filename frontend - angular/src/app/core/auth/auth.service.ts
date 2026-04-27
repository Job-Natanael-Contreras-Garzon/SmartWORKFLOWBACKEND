import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  departmentId: string | null;
  orgSlug: string | null;
  orgName: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY    = 'auth_token';
  private readonly ROLE_KEY     = 'user_role';
  private readonly USER_ID_KEY  = 'user_id';
  private readonly DEPT_ID_KEY  = 'dept_id';
  private readonly ORG_SLUG_KEY = 'org_slug';
  private readonly ORG_NAME_KEY = 'org_name';
  private readonly USER_NAME_KEY = 'user_name';

  /** Signal reactivo con el rol actual (usado en guards y UI) */
  currentUserRole = signal<string | null>(this.getRole());

  constructor(private http: HttpClient, private router: Router) {}

  // ── Getters ──────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  getDepartmentId(): string | null {
    return localStorage.getItem(this.DEPT_ID_KEY);
  }

  getOrgSlug(): string | null {
    return localStorage.getItem(this.ORG_SLUG_KEY);
  }

  getOrgName(): string | null {
    return localStorage.getItem(this.ORG_NAME_KEY);
  }

  getUserName(): string | null {
    return localStorage.getItem(this.USER_NAME_KEY);
  }

  isSuperAdmin(): boolean {
    return this.getRole() === 'SUPER_ADMIN';
  }

  // ── Auth Actions ─────────────────────────────────────────────

  /**
   * Persiste los datos de sesión después de un login exitoso.
   * El refreshToken llega como cookie HttpOnly desde el backend
   * (no es accesible por JS) — no es necesario almacenarlo manualmente.
   */
  login(authResult: {
    token: string;
    role: string;
    userId: string;
    userName: string;
    departmentId?: string;
    orgSlug?: string;
    orgName?: string;
  }): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    localStorage.setItem(this.ROLE_KEY, authResult.role);
    localStorage.setItem(this.USER_ID_KEY, authResult.userId);
    localStorage.setItem(this.USER_NAME_KEY, authResult.userName);

    if (authResult.departmentId) {
      localStorage.setItem(this.DEPT_ID_KEY, authResult.departmentId);
    } else {
      localStorage.removeItem(this.DEPT_ID_KEY);
    }

    if (authResult.orgSlug) {
      localStorage.setItem(this.ORG_SLUG_KEY, authResult.orgSlug);
    } else {
      localStorage.removeItem(this.ORG_SLUG_KEY);
    }

    if (authResult.orgName) {
      localStorage.setItem(this.ORG_NAME_KEY, authResult.orgName);
    } else {
      localStorage.removeItem(this.ORG_NAME_KEY);
    }

    this.currentUserRole.set(authResult.role);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.DEPT_ID_KEY);
    localStorage.removeItem(this.ORG_SLUG_KEY);
    localStorage.removeItem(this.ORG_NAME_KEY);
    localStorage.removeItem(this.USER_NAME_KEY);
    localStorage.removeItem('tenant_slug');
    this.currentUserRole.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Solicita un nuevo accessToken al backend usando la cookie HttpOnly
   * de refreshToken que el navegador envía automáticamente.
   */
  refreshToken(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>('/api/auth/refresh', {}, { withCredentials: true }).pipe(
      tap(res => {
        if (res.accessToken) {
          localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        }
      })
    );
  }

  hasRole(expectedRoles: string[]): boolean {
    const role = this.getRole();
    if (!role) return false;
    return expectedRoles.includes(role);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
