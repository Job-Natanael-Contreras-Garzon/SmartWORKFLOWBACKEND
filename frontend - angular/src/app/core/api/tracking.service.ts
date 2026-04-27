import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface TrackingStep {
  stepName: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  completedAt?: string;
  assignedTo?: string;
  department?: string;
  notes?: string;
}

export interface TrackingResult {
  trackingCode: string;
  title: string;
  description?: string;
  currentStatus: string;
  currentStep?: string;
  currentDepartment?: string;
  submittedAt: string;
  estimatedCompletionDate?: string;
  steps: TrackingStep[];
}

/* ── ETA / BottleneckAnalyzer models ──────────────────────────── */

/** Estadísticas históricas de un paso/departamento */
export interface StepEtaInfo {
  /** Nombre del paso en el flujo */
  stepName: string;
  /** Departamento responsable (sin nombre del funcionario) */
  department: string;
  /** Duración promedio histórica en HORAS */
  avgDurationHours: number;
  /** Duración mínima registrada en horas */
  minDurationHours?: number;
  /** Duración máxima registrada en horas */
  maxDurationHours?: number;
  /** Número de trámites históricos usados para el cálculo */
  sampleSize?: number;
  /** Cuándo entró el trámite actual a este paso (ISO 8601) */
  enteredAt?: string;
  /** Hora estimada de salida de este paso (ISO 8601) */
  estimatedExitAt?: string;
  /** Si es el paso activo del trámite actual */
  isCurrentStep: boolean;
  /** Si ya fue completado */
  isCompleted: boolean;
}

/** Respuesta del endpoint /eta, alimentado por el BottleneckAnalyzer */
export interface TrackingEta {
  trackingCode: string;
  /** Paso activo con sus datos de tiempo */
  currentStep?: StepEtaInfo;
  /** Horas totales estimadas restantes (suma de pasos PENDING + current) */
  totalRemainingHours?: number;
  /** Fecha estimada de resolución total (ISO 8601) */
  estimatedCompletionAt?: string;
  /** Lista completa de pasos con sus promedios históricos */
  steps: StepEtaInfo[];
}

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly BASE = '/api/public/track';

  constructor(private http: HttpClient) {}

  search(trackingCode: string): Observable<TrackingResult> {
    return this.http
      .get<TrackingResult>(`${this.BASE}/${trackingCode.trim().toUpperCase()}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene datos de tiempo estimado del BottleneckAnalyzer para un trámite.
   * Endpoint público: GET /api/public/track/{code}/eta
   */
  getEta(trackingCode: string): Observable<TrackingEta> {
    return this.http
      .get<TrackingEta>(`${this.BASE}/${trackingCode.trim().toUpperCase()}/eta`)
      .pipe(catchError(this.handleError));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    return throwError(() => err);
  }
}
