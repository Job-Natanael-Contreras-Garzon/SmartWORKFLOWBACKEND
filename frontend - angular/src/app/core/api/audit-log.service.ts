import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private http = inject(HttpClient);
  private readonly BASE_URL = '/api/audit-logs';

  getGlobalLogs(page = 0, size = 20): Observable<PaginatedResponse<AuditLogEntry>> {
    return this.http.get<PaginatedResponse<AuditLogEntry>>(`${this.BASE_URL}/global`, {
      params: { page, size, sort: 'createdAt,desc' }
    });
  }

  getSystemLogs(): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.BASE_URL}/system`);
  }

  getOrgLogs(orgId: string): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.BASE_URL}/org/${orgId}`);
  }
}
