import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OrganizationService, Organization } from '../../core/api/organization.service';
import { AuditLogService, AuditLogEntry } from '../../core/api/audit-log.service';

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
    :host { display: block; min-height: 100vh; background: #12131a; color: #e3e1eb; font-family: 'Inter', sans-serif; }

    .sa-container { max-width: 1280px; margin: 0 auto; padding: 0 24px 48px; }

    /* Header */
    .sa-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 24px 0; border-bottom: 1px solid #444653;
      margin-bottom: 32px;
    }
    .sa-header__left { display: flex; align-items: center; gap: 16px; }
    .sa-header__right { display: flex; align-items: center; gap: 16px; }
    .sa-logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.25rem; color: #fff; }
    .sa-badge {
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
      padding: 4px 12px; border-radius: 9999px;
      background: #1e40af; color: #fff;
    }
    .sa-user-name { color: #c4c5d5; font-size: 0.875rem; }

    /* Buttons */
    .sa-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
      border: none; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sa-btn--primary { background: #1e40af; color: #fff; }
    .sa-btn--primary:hover { background: #1e3a8a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3); }
    .sa-btn--primary:active { transform: translateY(0); }
    .sa-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    
    .sa-btn--ghost { background: transparent; color: #c4c5d5; border: 1px solid #444653; }
    .sa-btn--ghost:hover { background: rgba(196, 197, 213, 0.05); color: #fff; border-color: #8e909f; }
    .sa-btn--sm { padding: 6px 12px; font-size: 0.8rem; }

    /* Stats */
    .sa-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .sa-card--stat {
      background: #1a1b22; border: 1px solid #444653; border-radius: 8px;
      padding: 24px; display: flex; align-items: center; gap: 20px;
    }
    .sa-card__icon {
      width: 52px; height: 52px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
    }
    .sa-card__icon--blue { background: rgba(30, 64, 175, 0.15); color: #b8c4ff; }
    .sa-card__icon--green { background: rgba(21, 128, 61, 0.15); color: #4ade80; }
    .sa-card__data { display: flex; flex-direction: column; }
    .sa-card__value { font-size: 2rem; font-weight: 700; color: #fff; line-height: 1; }
    .sa-card__label { font-size: 0.85rem; color: #8e909f; margin-top: 6px; font-weight: 500; }

    /* Grid */
    .sa-grid { display: grid; grid-template-columns: 2fr 1.2fr; gap: 24px; }
    @media (max-width: 1024px) { .sa-grid { grid-template-columns: 1fr; } }

    /* Panels */
    .sa-panel {
      background: #1e1f26; border: 1px solid #444653; border-radius: 8px;
      padding: 24px; overflow: hidden;
    }
    .sa-panel__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .sa-panel__header h2 { font-size: 1.125rem; font-weight: 700; color: #fff; margin: 0; letter-spacing: -0.01em; }

    /* Table */
    .sa-table-wrap { overflow-x: auto; margin: 0 -24px; padding: 0 24px; }
    .sa-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .sa-table th { 
      text-align: left; padding: 12px 16px; color: #8e909f; font-weight: 600; 
      border-bottom: 1px solid #444653; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.75rem;
    }
    .sa-table td { padding: 16px; border-bottom: 1px solid rgba(68, 70, 83, 0.5); }
    .sa-org-name { display: flex; align-items: center; gap: 12px; font-weight: 500; color: #fff; }
    .sa-org-avatar {
      width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #1e40af, #3755c3); color: #fff; font-weight: 700; font-size: 0.9rem;
    }
    .sa-slug {
      font-size: 0.8rem; padding: 4px 10px; border-radius: 4px; font-family: 'Roboto Mono', monospace;
      background: #33343c; color: #b8c4ff; border: 1px solid #444653;
    }
    .sa-muted { color: #8e909f; }
    .sa-empty { text-align: center; color: #8e909f; padding: 48px 24px; font-style: italic; }

    /* Form */
    .sa-form-card {
      background: #1a1b22; border: 1px solid #1e40af;
      border-radius: 8px; padding: 24px; margin-bottom: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }
    .sa-form-card h3 { font-size: 1rem; margin: 0 0 20px; color: #b8c4ff; font-weight: 700; }
    .sa-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .sa-form-grid { grid-template-columns: 1fr; } }
    .sa-field label { display: block; font-size: 0.75rem; color: #8e909f; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .sa-field input {
      width: 100%; height: 40px; padding: 0 12px; border: 1px solid #444653; border-radius: 8px;
      background: #12131a; color: #e3e1eb; font-size: 0.875rem; box-sizing: border-box; transition: border-color 0.2s;
    }
    .sa-field input:focus { outline: none; border-color: #1e40af; }
    .sa-form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
    .sa-error { color: #ffb4ab; font-size: 0.85rem; margin-top: 12px; padding: 8px 12px; background: rgba(147, 0, 10, 0.1); border-radius: 4px; border-left: 3px solid #ffb4ab; }

    /* Audit Log */
    .sa-log-list { display: flex; flex-direction: column; gap: 12px; max-height: 600px; overflow-y: auto; padding-right: 8px; }
    .sa-log-entry {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-radius: 8px; background: #1a1b22;
      border: 1px solid #444653; transition: transform 0.15s;
    }
    .sa-log-entry:hover { border-color: #8e909f; }
    .sa-log-action { display: flex; align-items: center; gap: 12px; }
    .sa-log-badge {
      font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 4px;
      background: #33343c; color: #b9c7df; text-transform: uppercase; letter-spacing: 0.02em;
    }
    .sa-log-badge[data-action="CREATE_ORG"] { background: rgba(21, 128, 61, 0.2); color: #4ade80; }
    .sa-log-badge[data-action="CREATE_USER"] { background: rgba(30, 64, 175, 0.2); color: #b8c4ff; }
    .sa-log-entity { font-size: 0.85rem; color: #e3e1eb; font-weight: 500; }
    .sa-log-time { font-size: 0.75rem; color: #8e909f; font-family: 'Roboto Mono', monospace; }

    /* Custom Scrollbar */
    .sa-log-list::-webkit-scrollbar { width: 6px; }
    .sa-log-list::-webkit-scrollbar-track { background: transparent; }
    .sa-log-list::-webkit-scrollbar-thumb { background: #444653; border-radius: 3px; }
    .sa-log-list::-webkit-scrollbar-thumb:hover { background: #8e909f; }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private orgService = inject(OrganizationService);
  private auditLogService = inject(AuditLogService);
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
    this.orgService.getOrganizations().subscribe({
      next: (data) => this.orgs.set(data),
      error: () => {}
    });
  }

  loadAuditLogs(): void {
    this.auditLogService.getGlobalLogs(0, 50).subscribe({
      next: (data) => this.auditLogs.set(data.content || []),
      error: () => {}
    });
  }

  createOrg(): void {
    this.isCreating.set(true);
    this.createError.set(null);

    this.orgService.createOrganization(this.newOrg).subscribe({
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
