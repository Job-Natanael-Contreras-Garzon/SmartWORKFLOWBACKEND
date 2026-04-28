import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly BASE_URL = '/api/users';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.BASE_URL);
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
