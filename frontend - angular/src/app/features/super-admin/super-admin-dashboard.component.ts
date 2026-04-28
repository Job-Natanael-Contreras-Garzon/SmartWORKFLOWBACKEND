import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OrganizationService, Organization } from '../../core/api/organization.service';
import { AuditLogService, AuditLogEntry } from '../../core/api/audit-log.service';
import { UserService, User } from '../../core/api/user.service';

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
        </div>
        <div class="sa-header__right">
          <span class="sa-badge">{{ authService.getUserName() }}</span>
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

          <!-- Modal form logic moved to the bottom overlay -->

          <!-- Org List -->
          <div class="sa-table-wrap sa-desktop-only">
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

          <!-- Mobile Org Cards -->
          <div class="sa-mobile-only sa-user-cards">
            @for (org of orgs(); track org.id) {
              <div class="sa-user-card sa-user-card--org">
                <div class="sa-user-card__header">
                  <div class="sa-user-info">
                    <span class="sa-user-avatar">{{ org.name.charAt(0) }}</span>
                    <div class="sa-user-details">
                      <span class="sa-user-name">{{ org.name }}</span>
                      <span class="sa-user-email text-xs">{{ org.createdAt | date:'dd/MM/yyyy' }}</span>
                    </div>
                  </div>
                  <button class="sa-btn sa-btn--primary sa-btn--sm sa-btn--glow" (click)="viewOrgUsers(org)">
                    Usuarios
                  </button>
                </div>
                <div class="sa-user-card__body sa-user-card__body--compact">
                  <div class="sa-card-field">
                    <label>ID / SLUG</label>
                    <code class="sa-slug">{{ org.slug }}</code>
                  </div>
                </div>
              </div>
            }
            @if (orgs().length === 0) {
              <div class="sa-empty-state">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
                <p>No hay organizaciones registradas</p>
              </div>
            }
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

    <!-- Users Modal Overlay -->
    @if (showUsersModal()) {
      <div class="sa-modal-overlay" (click)="closeUsersModal()">
        <div class="sa-modal" (click)="$event.stopPropagation()">
          <div class="sa-modal__header">
            <div class="sa-modal__title">
              <span class="sa-org-avatar sa-org-avatar--lg">{{ selectedOrg()?.name?.charAt(0) }}</span>
              <div class="sa-modal__header-text">
                <h2>Usuarios de {{ selectedOrg()?.name }}</h2>
                <p class="sa-muted">Gestionar equipo y accesos</p>
              </div>
            </div>
            <button class="sa-btn sa-btn--ghost sa-btn--icon" (click)="closeUsersModal()">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="sa-modal__filters">
            <div class="sa-field sa-field--inline">
              <label>Rol</label>
              <select [ngModel]="selectedRole()" (ngModelChange)="selectedRole.set($event)">
                <option value="">Todos los Roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="MANAGER">Gerente</option>
                <option value="OFFICER">Oficial</option>
              </select>
            </div>
            <div class="sa-field sa-field--inline">
              <label>Estado</label>
              <select [ngModel]="selectedStatus()" (ngModelChange)="selectedStatus.set($event)">
                <option value="">Todos los Estados</option>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="SUSPENDED">Suspendido</option>
              </select>
            </div>
            <div class="sa-btn-actualizar">
              <button class="sa-btn sa-btn--primary" (click)="loadOrgUsers()" [disabled]="isLoadingUsers()">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" [class.sa-spin]="isLoadingUsers()">
                  <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                Actualizar
              </button>
            </div>
          </div>

          <div class="sa-modal__content">
            @if (isLoadingUsers()) {
              <div class="sa-loader-wrap">
                <div class="sa-loader"></div>
                <p>Cargando usuarios...</p>
              </div>
            } @else {
              <!-- Desktop Table View -->
              <div class="sa-table-wrap sa-desktop-only">
                <table class="sa-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th class="sa-text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (user of paginatedUsers(); track user.id) {
                      <tr>
                        <td>
                          <div class="sa-user-info">
                            <span class="sa-user-avatar">{{ user.name.charAt(0) }}</span>
                            <div class="sa-user-details">
                              <span class="sa-user-name">{{ user.name }}</span>
                              <span class="sa-user-email">{{ user.email }}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="sa-role-badge" [attr.data-role]="user.role">{{ user.role }}</span>
                        </td>
                        <td>
                          <select 
                            class="sa-status-select" 
                            [value]="user.status" 
                            (change)="updateUserStatus(user, $any($event.target).value)"
                            [attr.data-status]="user.status">
                            <option value="ACTIVE">ACTIVO</option>
                            <option value="INACTIVE">INACTIVO</option>
                            <option value="SUSPENDED">SUSPENDIDO</option>
                          </select>
                        </td>
                        <td class="sa-text-right">
                          <button 
                            class="sa-btn sa-btn--sm sa-btn--ghost sa-btn--danger" 
                            (click)="deleteUser(user.id)"
                            title="Eliminar Usuario">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Mobile Card View -->
              <div class="sa-mobile-only sa-user-cards">
                @for (user of paginatedUsers(); track user.id) {
                  <div class="sa-user-card">
                    <div class="sa-user-card__header">
                      <div class="sa-user-info">
                        <span class="sa-user-avatar">{{ user.name.charAt(0) }}</span>
                        <div class="sa-user-details">
                          <span class="sa-user-name">{{ user.name }}</span>
                          <span class="sa-user-email">{{ user.email }}</span>
                        </div>
                      </div>
                      <button 
                        class="sa-btn sa-btn--sm sa-btn--ghost sa-btn--danger" 
                        (click)="deleteUser(user.id)">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                    <div class="sa-user-card__body">
                      <div class="sa-card-field">
                        <label>Rol</label>
                        <span class="sa-role-badge" [attr.data-role]="user.role">{{ user.role }}</span>
                      </div>
                      <div class="sa-card-field">
                        <label>Estado</label>
                        <select 
                          class="sa-status-select" 
                          [value]="user.status" 
                          (change)="updateUserStatus(user, $any($event.target).value)"
                          [attr.data-status]="user.status">
                          <option value="ACTIVE">ACTIVO</option>
                          <option value="INACTIVE">INACTIVO</option>
                          <option value="SUSPENDED">SUSPENDIDO</option>
                        </select>
                      </div>
                    </div>
                  </div>
                }
              </div>

              @if (orgUsers().length === 0) {
                <p class="sa-empty">No se encontraron usuarios</p>
              }
            }
          </div>

          <!-- Modal Footer with Pagination -->
          @if (orgUsers().length > 0) {
            <div class="sa-modal__footer">
              <span class="sa-muted text-xs">Mostrando {{ paginatedUsers().length }} de {{ orgUsers().length }} usuarios</span>
              <div class="sa-pagination">
                <button 
                  class="sa-btn sa-btn--sm sa-btn--ghost" 
                  [disabled]="currentPage() === 1"
                  (click)="prevPage()">
                  Anterior
                </button>
                <span class="sa-page-info">Página {{ currentPage() }} de {{ totalPages() }}</span>
                <button 
                  class="sa-btn sa-btn--sm sa-btn--ghost" 
                  [disabled]="currentPage() === totalPages()"
                  (click)="nextPage()">
                  Siguiente
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- Create Org Modal Overlay -->
    @if (showCreateOrg()) {
      <div class="sa-modal-overlay" (click)="showCreateOrg.set(false)">
        <div class="sa-modal" (click)="$event.stopPropagation()" style="max-width: 500px; height: auto;">
          <div class="sa-modal__header">
            <div class="sa-modal__title">
              <div class="sa-modal__header-text">
                <h2>Crear Organización</h2>
                <p class="sa-muted text-sm">Registrar nueva empresa</p>
              </div>
            </div>
            <button class="sa-btn sa-btn--ghost sa-btn--icon" (click)="showCreateOrg.set(false)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="sa-modal__content" style="padding: 24px;">
            <div class="sa-form-grid" style="display: flex; flex-direction: column; gap: 16px;">
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
            @if (createError()) {
              <p class="sa-error" style="margin-top: 16px;">{{ createError() }}</p>
            }
          </div>

          <div class="sa-modal__footer" style="justify-content: flex-end; gap: 12px; display: flex;">
            <button class="sa-btn sa-btn--ghost" (click)="showCreateOrg.set(false)">Cancelar</button>
            <button class="sa-btn sa-btn--primary" (click)="createOrg()" [disabled]="isCreating()">
              {{ isCreating() ? 'Creando...' : 'Crear Organización' }}
            </button>
          </div>
        </div>
      </div>
    }

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

    /* Modal */
    .sa-modal-overlay {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 20px;
    }
    .sa-modal {
      background: #1e1f26; border: 1px solid #444653; border-radius: 20px;
      width: 95%; max-width: 850px; height: 90vh; max-height: 800px;
      display: flex; flex-direction: column;
      box-shadow: 0 32px 64px rgba(0, 0, 0, 0.6); overflow: hidden;
      position: relative;
    }
    .sa-modal__header {
      padding: 24px; border-bottom: 1px solid #444653;
      display: flex; justify-content: space-between; align-items: flex-start;
      background: rgba(30, 31, 38, 0.5);
    }
    .sa-modal__title { display: flex; align-items: center; gap: 16px; width: 100%; }
    .sa-modal__title h2 { margin: 0; font-size: 1.15rem; color: #fff; font-weight: 700; letter-spacing: -0.01em; }
    .sa-modal__header-text { display: flex; flex-direction: column; }
    .sa-org-avatar--lg { width: 44px; height: 44px; font-size: 1.1rem; border-radius: 12px; }

    .sa-modal__filters {
      padding: 16px 24px; background: #1a1b22; border-bottom: 1px solid #444653;
      display: flex; gap: 24px; flex-wrap: wrap;
    }
    .sa-field--inline { display: flex; align-items: center; gap: 12px; }
    .sa-field--inline label { margin-bottom: 0; white-space: nowrap; font-size: 0.75rem; }
    .sa-field--inline select {
      background: #12131a; border: 1px solid #444653; color: #e3e1eb;
      height: 34px; border-radius: 8px; padding: 0 10px; font-size: 0.8rem; outline: none;
    }

    .sa-modal__content { padding: 0; flex: 1; overflow-y: auto; background: #1e1f26; }
    
    /* Responsive View Handling */
    .sa-desktop-only { display: block !important; }
    .sa-mobile-only { display: none !important; }

    @media (max-width: 768px) {
      .sa-desktop-only { display: none !important; }
      .sa-mobile-only { display: block !important; }
      .sa-modal { height: 95vh; max-height: none; width: 98%; }
      .sa-modal__header { flex-direction: column; align-items: center; text-align: center; gap: 16px; }
      .sa-modal__title { flex-direction: column; text-align: center; }
      .sa-modal__filters { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 16px; 
        padding: 20px; 
      }
      .sa-field--inline { flex-direction: column; align-items: center; gap: 8px; width: 100%; }
      .sa-field--inline select { width: 100%; text-align: center; }
      .sa-btn-actualizar { grid-column: span 2; display: flex; justify-content: center; width: 100%; }
      .sa-modal__footer { flex-direction: column; gap: 16px; text-align: center; }
    }

    /* Mobile Cards */
    .sa-user-cards { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
    .sa-user-card { 
      background: #1a1b22; border: 1px solid #444653; border-radius: 16px;
      overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .sa-user-card__header {
      padding: 16px 20px; background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid #444653; display: flex; justify-content: space-between; align-items: center;
    }
    .sa-user-card__body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .sa-card-field { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .sa-card-field:last-child { border-bottom: none; }
    .sa-card-field label { font-size: 0.7rem; color: #8e909f; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Footer & Pagination */
    .sa-modal__footer {
      padding: 16px 24px; border-top: 1px solid #444653; background: #1a1b22;
      display: flex; justify-content: space-between; align-items: center;
    }
    .sa-pagination { display: flex; align-items: center; gap: 16px; }
    .sa-page-info { font-size: 0.8rem; color: #e3e1eb; font-weight: 500; }
    
    .text-xs { font-size: 0.75rem; }

    /* Existing internal styles kept for consistency */
    .sa-user-info { display: flex; align-items: center; gap: 12px; }
    .sa-user-avatar {
      width: 32px; height: 32px; border-radius: 8px; background: #33343c;
      display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.8rem; color: #b8c4ff;
    }
    .sa-user-details { display: flex; flex-direction: column; }
    .sa-user-name { font-weight: 600; color: #fff; font-size: 0.875rem; }
    .sa-user-email { font-size: 0.75rem; color: #8e909f; }
    
    .sa-role-badge {
      font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-radius: 4px;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .sa-role-badge[data-role="ADMIN"] { background: rgba(30, 64, 175, 0.2); color: #b8c4ff; }
    .sa-role-badge[data-role="MANAGER"] { background: rgba(21, 128, 61, 0.2); color: #4ade80; }
    .sa-role-badge[data-role="OFFICER"] { background: rgba(217, 119, 6, 0.2); color: #fbbf24; }
    .sa-role-badge[data-role="SUPER_ADMIN"] { background: rgba(147, 51, 234, 0.2); color: #d8b4fe; }

    .sa-status-select {
      background: transparent; border: 1px solid transparent; color: #fff;
      font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 4px;
      cursor: pointer; transition: all 0.2s; outline: none;
    }
    .sa-status-select:hover { border-color: #444653; background: #12131a; }
    .sa-status-select[data-status="ACTIVE"] { color: #4ade80; }
    .sa-status-select[data-status="INACTIVE"] { color: #f87171; }
    .sa-status-select[data-status="SUSPENDED"] { color: #fbbf24; }

    .sa-text-right { text-align: right; }
    .sa-btn--icon { padding: 8px; border-radius: 8px; }
    .sa-btn--danger:hover { color: #f87171; border-color: rgba(248, 113, 113, 0.3); background: rgba(248, 113, 113, 0.05); }

    .sa-loader-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px; gap: 16px; color: #8e909f; }
    .sa-loader {
      width: 32px; height: 32px; border: 3px solid #444653; border-top-color: #1e40af;
      border-radius: 50%; animation: sa-spin 0.8s linear infinite;
    }
    @keyframes sa-spin { to { transform: rotate(360deg); } }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private orgService = inject(OrganizationService);
  private auditLogService = inject(AuditLogService);
  private userService = inject(UserService);
  private router = inject(Router);

  orgs = signal<Organization[]>([]);
  auditLogs = signal<AuditLogEntry[]>([]);

  // Organization Users Modal
  showUsersModal = signal(false);
  selectedOrg = signal<Organization | null>(null);
  orgUsers = signal<User[]>([]);
  isLoadingUsers = signal(false);
  selectedRole = signal('');
  selectedStatus = signal('');

  // Pagination (Frontend-only)
  currentPage = signal(1);
  pageSize = 15;

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.orgUsers().slice(start, end);
  });

  totalPages = computed(() => {
    const total = this.orgUsers().length;
    return Math.ceil(total / this.pageSize);
  });

  showCreateOrg = signal(false);
  isCreating = signal(false);
  createError = signal<string | null>(null);

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
      error: () => { }
    });
  }

  loadAuditLogs(): void {
    this.auditLogService.getGlobalLogs(0, 50).subscribe({
      next: (data) => this.auditLogs.set(data.content || []),
      error: () => { }
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
    this.selectedOrg.set(org);
    this.showUsersModal.set(true);
    this.loadOrgUsers();
  }

  loadOrgUsers(): void {
    const org = this.selectedOrg();
    if (!org) return;

    this.isLoadingUsers.set(true);
    const filters = {
      orgId: org.id,
      role: this.selectedRole() || undefined,
      status: this.selectedStatus() || undefined
    };

    console.log('--- FETCHING USERS ---');
    console.log('Filters being sent:', filters);
    const token = localStorage.getItem('auth_token');
    console.log('Auth Token Present:', !!token);

    const manualUrl = `/api/users?orgId=${org.id}` +
      (this.selectedRole() ? `&role=${this.selectedRole()}` : '') +
      (this.selectedStatus() ? `&status=${this.selectedStatus()}` : '');
    console.log('Manual URL check:', manualUrl);

    this.userService.getUsers(filters).subscribe({
      next: (users) => {
        console.log('Response Success:', users);
        this.orgUsers.set(users);
        this.isLoadingUsers.set(false);
        this.currentPage.set(1);
      },
      error: (err) => {
        console.error('Response Error:', err);
        this.isLoadingUsers.set(false);
      }
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  updateUserStatus(user: User, newStatus: string): void {
    this.userService.updateUser(user.id, { status: newStatus }).subscribe({
      next: () => this.loadOrgUsers()
    });
  }

  deleteUser(userId: string): void {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => this.loadOrgUsers()
      });
    }
  }

  closeUsersModal(): void {
    this.showUsersModal.set(false);
    this.selectedOrg.set(null);
    this.orgUsers.set([]);
    this.selectedRole.set('');
    this.selectedStatus.set('');
  }

  logout(): void {
    this.authService.logout();
  }
}
