import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  settings: any;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private http = inject(HttpClient);
  private readonly BASE_URL = '/api/organizations';

  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.BASE_URL);
  }

  getOrganization(id: string): Observable<Organization> {
    return this.http.get<Organization>(`${this.BASE_URL}/${id}`);
  }

  createOrganization(org: any): Observable<Organization> {
    return this.http.post<Organization>(this.BASE_URL, org);
  }

  updateOrganization(id: string, org: any): Observable<Organization> {
    return this.http.put<Organization>(`${this.BASE_URL}/${id}`, org);
  }

  getOrganizationUsers(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/${id}/users`);
  }
}
