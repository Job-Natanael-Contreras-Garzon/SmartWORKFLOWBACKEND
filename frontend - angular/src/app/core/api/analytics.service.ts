import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BottleneckInfo {
  activityName: string;
  avgDuration: number;
  caseCount: number;
}

export interface DashboardMetrics {
  activeCases: number;
  completedToday: number;
  avgResolutionTime: number;
  slaBreachRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private readonly BASE_URL = '/api/analytics';

  getBottlenecks(): Observable<BottleneckInfo[]> {
    return this.http.get<BottleneckInfo[]>(`${this.BASE_URL}/bottlenecks`);
  }

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.BASE_URL}/dashboard`);
  }
}
