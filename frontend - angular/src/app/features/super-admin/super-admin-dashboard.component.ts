import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sa-container">
      <!-- Header -->
      <header class="sa-header">
        <div class="sa-header__left">
          <div class="sa-logo">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>SmartWORKFLOW</span>
          </div>
          <span class="sa-badge">Super Admin</span>
        </div>
        <div class="sa-header__right">
          <span class="sa-user-name">{{ authService.getUserName() }}</span>
          <button class="sa-btn sa-btn--ghost" (click)="logout()">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <section class="sa-stats">
        <div class="sa-card sa-card--stat">
          <div class="sa-card__icon sa-card__icon--blue">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <div class="sa-card__data">
            <span class="sa-card__value">{{ orgs().length }}</span>
            <span class="sa-card__label">Organizaciones</span>
          </div>
        </div>
        <div class="sa-card sa-card--stat">
          <div class="sa-card__icon sa-card__icon--green">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="sa-card__data">
            <span class="sa-card__value">{{ auditLogs().length }}</span>
            <span class="sa-card__label">Bitácora</span>
          </div>
        </div>
      </section>

      <!-- Main Grid -->
      <div class="sa-grid">
        <!-- Organizations Panel -->
        <section class="sa-panel">
          <div class="sa-panel__header">
            <h2>Organizaciones</h2>
            <button class="sa-btn sa-btn--primary" (click)="showCreateOrg.set(true)">
              + Nueva Org
            </button>
          </div>

          <!-- Create Org Form -->
          @if (showCreateOrg()) {
            <div class="sa-form-card">
              <h3>Crear Organización</h3>
              <div class="sa-form-grid">
                <div class="sa-field">
                  <label>Nombre</label>
                  <input type="text" [(ngModel)]="newOrg.name" placeholder="Nombre de la organización">
                </div>
                <div class="sa-field">
                  <label>Slug (subdominio)</label>
                  <input type="text" [(ngModel)]="newOrg.slug" placeholder="mi-empresa">
                </div>
                <div class="sa-field">
                  <label>Email del Admin</label>
                  <input type="email" [(ngModel)]="newOrg.adminEmail" placeholder="admin@empresa.com">
                </div>
                <div class="sa-field">
                  <label>Nombre del Admin</label>
                  <input type="text" [(ngModel)]="newOrg.adminName" placeholder="Administrador">
                </div>
                <div class="sa-field">
                  <label>Contraseña del Admin</label>
                  <input type="password" [(ngModel)]="newOrg.adminPassword" placeholder="••••••••">
                </div>
              </div>
              <div class="sa-form-actions">
                <button class="sa-btn sa-btn--ghost" (click)="showCreateOrg.set(false)">Cancelar</button>
                <button class="sa-btn sa-btn--primary" (click)="createOrg()" [disabled]="isCreating()">
                  {{ isCreating() ? 'Creando...' : 'Crear Organización' }}
                </button>
              </div>
              @if (createError()) {
                <p class="sa-error">{{ createError() }}</p>
              }
            </div>
          }

          <!-- Org List -->
          <div class="sa-table-wrap">
            <table class="sa-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (org of orgs(); track org.id) {
                  <tr>
                    <td>
                      <div class="sa-org-name">
                        <span class="sa-org-avatar">{{ org.name.charAt(0) }}</span>
                        {{ org.name }}
                      </div>
                    </td>
                    <td><code class="sa-slug">{{ org.slug }}</code></td>
                    <td class="sa-muted">{{ org.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td>
                      <button class="sa-btn sa-btn--sm sa-btn--ghost" (click)="viewOrgUsers(org)">
                        👥 Usuarios
                      </button>
                    </td>
                  </tr>
                }
                @if (orgs().length === 0) {
                  <tr>
                    <td colspan="4" class="sa-empty">No hay organizaciones registradas</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Audit Log Panel -->
        <section class="sa-panel">
          <div class="sa-panel__header">
            <h2>Bitácora del Sistema</h2>
          </div>
          <div class="sa-log-list">
            @for (log of auditLogs(); track log.id) {
              <div class="sa-log-entry">
                <div class="sa-log-action">
                  <span class="sa-log-badge" [attr.data-action]="log.action">{{ log.action }}</span>
                  <span class="sa-log-entity">{{ log.entityType }}</span>
                </div>
                <span class="sa-log-time">{{ log.createdAt | date:'dd/MM HH:mm' }}</span>
              </div>
            }
            @if (auditLogs().length === 0) {
              <p class="sa-empty">Sin registros de auditoría</p>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #0f1117; color: #e4e4e7; }

    .sa-container { max-width: 1280px; margin: 0 auto; padding: 0 24px 48px; }

    /* Header */
    .sa-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 32px;
    }
    .sa-header__left { display: flex; align-items: center; gap: 16px; }
    .sa-header__right { display: flex; align-items: center; gap: 16px; }
    .sa-logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.15rem; color: #fff; }
    .sa-badge {
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
      padding: 4px 10px; border-radius: 20px;
      background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff;
    }
    .sa-user-name { color: #a1a1aa; font-size: 0.875rem; }

    /* Buttons */
    .sa-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 500;
      border: none; cursor: pointer; transition: all 0.15s;
    }
    .sa-btn--primary { background: #7c3aed; color: #fff; }
    .sa-btn--primary:hover { background: #6d28d9; }
    .sa-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .sa-btn--ghost { background: transparent; color: #a1a1aa; border: 1px solid rgba(255,255,255,0.1); }
    .sa-btn--ghost:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .sa-btn--sm { padding: 4px 10px; font-size: 0.8rem; }

    /* Stats */
    .sa-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .sa-card--stat {
      background: #1a1b23; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
      padding: 20px; display: flex; align-items: center; gap: 16px;
    }
    .sa-card__icon {
      width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
    }
    .sa-card__icon--blue { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .sa-card__icon--green { background: rgba(34,197,94,0.15); color: #22c55e; }
    .sa-card__data { display: flex; flex-direction: column; }
    .sa-card__value { font-size: 1.8rem; font-weight: 700; color: #fff; line-height: 1; }
    .sa-card__label { font-size: 0.8rem; color: #71717a; margin-top: 4px; }

    /* Grid */
    .sa-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    @media (max-width: 900px) { .sa-grid { grid-template-columns: 1fr; } }

    /* Panels */
    .sa-panel {
      background: #1a1b23; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
      padding: 24px; overflow: hidden;
    }
    .sa-panel__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .sa-panel__header h2 { font-size: 1.05rem; font-weight: 600; color: #fff; margin: 0; }

    /* Table */
    .sa-table-wrap { overflow-x: auto; }
    .sa-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .sa-table th { text-align: left; padding: 10px 12px; color: #71717a; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .sa-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .sa-org-name { display: flex; align-items: center; gap: 10px; }
    .sa-org-avatar {
      width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #7c3aed, #3b82f6); color: #fff; font-weight: 700; font-size: 0.85rem;
    }
    .sa-slug {
      font-size: 0.8rem; padding: 2px 8px; border-radius: 4px;
      background: rgba(124,58,237,0.15); color: #a78bfa;
    }
    .sa-muted { color: #71717a; }
    .sa-empty { text-align: center; color: #52525b; padding: 24px; }

    /* Form */
    .sa-form-card {
      background: rgba(124,58,237,0.05); border: 1px solid rgba(124,58,237,0.2);
      border-radius: 10px; padding: 20px; margin-bottom: 20px;
    }
    .sa-form-card h3 { font-size: 0.95rem; margin: 0 0 16px; color: #a78bfa; }
    .sa-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .sa-form-grid { grid-template-columns: 1fr; } }
    .sa-field label { display: block; font-size: 0.75rem; color: #71717a; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .sa-field input {
      width: 100%; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
      background: #0f1117; color: #e4e4e7; font-size: 0.875rem; box-sizing: border-box;
    }
    .sa-field input:focus { outline: none; border-color: #7c3aed; }
    .sa-form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .sa-error { color: #ef4444; font-size: 0.8rem; margin-top: 8px; }

    /* Audit Log */
    .sa-log-list { display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow-y: auto; }
    .sa-log-entry {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; border-radius: 8px; background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.04);
    }
    .sa-log-action { display: flex; align-items: center; gap: 8px; }
    .sa-log-badge {
      font-size: 0.7rem; font-weight: 600; padding: 3px 8px; border-radius: 4px;
      background: rgba(59,130,246,0.15); color: #60a5fa; text-transform: uppercase;
    }
    .sa-log-badge[data-action="CREATE_ORG"] { background: rgba(34,197,94,0.15); color: #4ade80; }
    .sa-log-badge[data-action="CREATE_USER"] { background: rgba(124,58,237,0.15); color: #a78bfa; }
    .sa-log-entity { font-size: 0.8rem; color: #a1a1aa; }
    .sa-log-time { font-size: 0.75rem; color: #52525b; }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private http   = inject(HttpClient);
  private router = inject(Router);

  orgs       = signal<Organization[]>([]);
  auditLogs  = signal<AuditLogEntry[]>([]);

  showCreateOrg = signal(false);
  isCreating    = signal(false);
  createError   = signal<string | null>(null);

  newOrg = {
    name: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  };

  ngOnInit(): void {
    this.loadOrgs();
    this.loadAuditLogs();
  }

  loadOrgs(): void {
    this.http.get<Organization[]>('/api/organizations').subscribe({
      next: (data) => this.orgs.set(data),
      error: () => {}
    });
  }

  loadAuditLogs(): void {
    this.http.get<{ content: AuditLogEntry[] }>('/api/audit-logs/global?size=50&sort=createdAt,desc').subscribe({
      next: (data) => this.auditLogs.set(data.content || []),
      error: () => {}
    });
  }

  createOrg(): void {
    this.isCreating.set(true);
    this.createError.set(null);

    this.http.post<Organization>('/api/organizations', this.newOrg).subscribe({
      next: () => {
        this.isCreating.set(false);
        this.showCreateOrg.set(false);
        this.newOrg = { name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' };
        this.loadOrgs();
      },
      error: (err) => {
        this.isCreating.set(false);
        this.createError.set(err.error?.message ?? 'Error al crear la organización');
      }
    });
  }

  viewOrgUsers(org: Organization): void {
    // Future: navigate to org detail with users list
    console.log('View users for:', org.slug);
  }

  logout(): void {
    this.authService.logout();
  }
}
