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

  getGlobalLogs(page = 0, size = 20, action?: string): Observable<PaginatedResponse<AuditLogEntry>> {
    const params: any = { page, size, sort: 'createdAt,desc' };
    if (action) params.action = action;
    return this.http.get<PaginatedResponse<AuditLogEntry>>(`${this.BASE_URL}/global`, { params });
  }

  getSystemLogs(page = 0, size = 20, action?: string): Observable<PaginatedResponse<AuditLogEntry>> {
    const params: any = { page, size, sort: 'createdAt,desc' };
    if (action) params.action = action;
    return this.http.get<PaginatedResponse<AuditLogEntry>>(`${this.BASE_URL}/system`, { params });
  }

  getOrgLogs(orgId: string): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.BASE_URL}/org/${orgId}`);
  }

  getActions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.BASE_URL}/actions`);
  }

  registerLocation(location: { country?: string; city?: string; region?: string }): Observable<{country: string; city: string; message: string}> {
    return this.http.post<{country: string; city: string; message: string}>(`${this.BASE_URL}/location`, location);
  }
}
