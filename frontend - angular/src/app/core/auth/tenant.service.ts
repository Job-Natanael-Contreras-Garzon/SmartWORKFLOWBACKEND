import { Injectable, signal, computed } from '@angular/core';

/**
 * TenantService — Detecta la organización (tenant) del contexto actual.
 *
 * Estrategia de resolución (en orden de prioridad):
 * 1. Query param `?tenant=cre` (desarrollo local)
 * 2. Subdominio `cre.smartworkflow.app` (producción)
 * 3. null → login de SUPER_ADMIN (sin org)
 */
@Injectable({
  providedIn: 'root'
})
export class TenantService {

  /** Slug de la organización activa (null = SUPER_ADMIN / raíz) */
  private _slug = signal<string | null>(this.detectSlug());

  /** Signal público reactivo */
  readonly slug = this._slug.asReadonly();

  /** ¿Estamos en un contexto de organización? */
  readonly isOrgContext = computed(() => this._slug() !== null);

  /** Forzar un slug (ej. después del login) */
  setSlug(slug: string | null): void {
    this._slug.set(slug);
    if (slug) {
      localStorage.setItem('tenant_slug', slug);
    } else {
      localStorage.removeItem('tenant_slug');
    }
  }

  /** Detecta el slug al instanciar el servicio */
  private detectSlug(): string | null {
    // 1. Query param ?tenant=xxx (dev)
    const params = new URLSearchParams(window.location.search);
    const tenantParam = params.get('tenant');
    if (tenantParam) return tenantParam;

    // 2. Subdominio: cre.smartworkflow.app → slug = 'cre'
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    // Solo aplicar si hay al menos 3 partes (sub.domain.tld)
    // y NO es 'www', 'app', 'api', ni 'localhost'
    const excludedSubs = ['www', 'app', 'api', 'localhost'];
    if (parts.length >= 3 && !excludedSubs.includes(parts[0])) {
      return parts[0];
    }

    // 3. Persistido en localStorage (ej. después de un login anterior)
    const stored = localStorage.getItem('tenant_slug');
    if (stored) return stored;

    // 4. Sin tenant → contexto global (SUPER_ADMIN)
    return null;
  }
}
