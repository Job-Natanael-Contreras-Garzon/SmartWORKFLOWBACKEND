import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dni?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private readonly BASE_URL = '/api/clients';

  getClients(search?: string): Observable<Client[]> {
    const params = search ? { search } : {};
    return this.http.get<Client[]>(this.BASE_URL, { params });
  }

  getClient(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.BASE_URL}/${id}`);
  }

  createClient(client: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.BASE_URL, client);
  }

  updateClient(id: string, client: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.BASE_URL}/${id}`, client);
  }
}
