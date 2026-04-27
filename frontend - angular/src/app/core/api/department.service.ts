import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Department {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private http = inject(HttpClient);
  private readonly BASE_URL = '/api/departments';

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.BASE_URL);
  }

  createDepartment(dept: Partial<Department>): Observable<Department> {
    return this.http.post<Department>(this.BASE_URL, dept);
  }

  updateDepartment(id: string, dept: Partial<Department>): Observable<Department> {
    return this.http.put<Department>(`${this.BASE_URL}/${id}`, dept);
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }

  getMembers(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/${id}/members`);
  }

  getDepartmentMembers(id: string): Observable<any[]> {
    return this.getMembers(id);
  }
}
