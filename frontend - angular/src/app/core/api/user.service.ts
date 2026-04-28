import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  departmentId?: string;
  password?: string;
  avatarUrl?: string | null;
  active?: boolean;
  manager?: boolean;
  officer?: boolean;
  admin?: boolean;
  superAdmin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly BASE_URL = '/api/users';

  getUsers(filters?: { orgId?: string, role?: string, status?: string }): Observable<User[]> {
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
    
    let params = new HttpParams();
    if (filters?.orgId) params = params.set('orgId', filters.orgId);
    if (filters?.role) params = params.set('role', filters.role);
    if (filters?.status) params = params.set('status', filters.status);

    return this.http.get<User[]>(this.BASE_URL, { params, headers });
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.BASE_URL, user);
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.BASE_URL}/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.BASE_URL}/me`);
  }

  impersonate(targetUserId: string): Observable<any> {
    return this.http.post<any>('/api/auth/impersonate', { targetUserId });
  }
}
