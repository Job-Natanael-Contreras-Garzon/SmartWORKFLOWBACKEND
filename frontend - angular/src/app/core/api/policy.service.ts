import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Policy {
  id: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  diagramJson?: string;
  diagramData?: string;
  createdAt: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  private http = inject(HttpClient);
  private readonly BASE_URL = '/api/policies';

  getPolicies(): Observable<Policy[]> {
    return this.http.get<Policy[]>(this.BASE_URL);
  }

  createPolicy(policy: Partial<Policy>): Observable<Policy> {
    return this.http.post<Policy>(this.BASE_URL, policy);
  }

  updatePolicy(id: string, policy: Partial<Policy>): Observable<Policy> {
    return this.http.put<Policy>(`${this.BASE_URL}/${id}`, policy);
  }

  publishPolicy(id: string): Observable<Policy> {
    return this.http.put<Policy>(`${this.BASE_URL}/${id}/publish`, {});
  }

  deprecatePolicy(id: string): Observable<Policy> {
    return this.http.put<Policy>(`${this.BASE_URL}/${id}/deprecate`, {});
  }

  saveDiagram(id: string, diagramJson: any): Observable<void> {
    return this.http.put<void>(`${this.BASE_URL}/${id}/diagram`, diagramJson);
  }

  validatePolicy(id: string): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/${id}/validate`, {});
  }
}
