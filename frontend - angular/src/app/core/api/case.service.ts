import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Case {
  id: string;
  trackingCode: string;
  status: string;
  policyId: string;
  clientId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  caseId: string;
  activity: { name: string };
  assignedTo?: { id: string; name: string };
  status: string;
  startedAt: string;
  priority: string;
}

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private http = inject(HttpClient);
  private readonly BASE_URL = '/api/cases';

  initiateCase(data: any): Observable<{ trackingCode: string }> {
    return this.http.post<{ trackingCode: string }>(this.BASE_URL, data);
  }

  trackCase(code: string): Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}/track/${code}`);
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.BASE_URL}/my-tasks`);
  }

  getDepartmentTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.BASE_URL}/department-tasks`);
  }

  completeTask(caseId: string, tokenId: string, data: any): Observable<void> {
    return this.http.post<void>(`${this.BASE_URL}/${caseId}/tokens/${tokenId}/complete`, data);
  }

  reassignTask(caseId: string, tokenId: string, userId: string): Observable<void> {
    return this.http.put<void>(`${this.BASE_URL}/${caseId}/tokens/${tokenId}/reassign`, { targetUserId: userId });
  }
}
