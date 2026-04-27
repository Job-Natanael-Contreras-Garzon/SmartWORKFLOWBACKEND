import { Injectable } from '@angular/core';
import { Client, IMessage, StompHeaders } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId: string;
  referenceType: string;
  targetUserId: string;
  read: boolean;
  createdAt: string;
}

export interface TaskPayload {
  tokenId: string;
  activityName: string;
  caseId: string;
}

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private client: Client;
  private notificationSubject = new Subject<NotificationPayload>();
  private taskSubject = new Subject<TaskPayload>();

  constructor(private authService: AuthService) {
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      debug: (msg: string) => console.log('[STOMP]', msg),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // Pasa el JWT en el CONNECT frame para que el backend pueda autenticar
      connectHeaders: this.buildConnectHeaders(),
    });

    this.client.onConnect = () => {
      console.log('[STOMP] Conectado al broker');
      this.subscribeToChannels();
    };

    this.client.onDisconnect = () => {
      console.log('[STOMP] Desconectado del broker');
    };

    this.client.onStompError = (frame) => {
      console.error('[STOMP] Error del broker:', frame.headers['message']);
      console.error('[STOMP] Detalle:', frame.body);
    };
  }

  /** Construye los headers de conexión STOMP incluyendo el JWT. */
  private buildConnectHeaders(): StompHeaders {
    const token = this.authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public connect(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('[STOMP] No hay token JWT, conexión cancelada.');
      return;
    }
    // Refresca los headers en cada intento de conexión (por si el token rotó)
    this.client.connectHeaders = this.buildConnectHeaders();
    this.client.activate();
  }

  public disconnect(): void {
    this.client.deactivate();
  }

  private subscribeToChannels(): void {
    const userId = this.authService.getUserId();
    const deptId = this.authService.getDepartmentId();

    // 1. Notificaciones personales del usuario
    if (userId) {
      this.client.subscribe(`/topic/user/${userId}/notifications`, (message: IMessage) => {
        const payload: NotificationPayload = JSON.parse(message.body);
        this.notificationSubject.next(payload);
      });
      console.log(`[STOMP] Subscrito a /topic/user/${userId}/notifications`);
    }

    // 2. Nuevas tareas del departamento
    if (deptId) {
      this.client.subscribe(`/topic/dept/${deptId}/new-tasks`, (message: IMessage) => {
        const taskPayload: TaskPayload = JSON.parse(message.body);
        this.taskSubject.next(taskPayload);
      });
      console.log(`[STOMP] Subscrito a /topic/dept/${deptId}/new-tasks`);
    }
  }

  public getNotifications(): Observable<NotificationPayload> {
    return this.notificationSubject.asObservable();
  }

  public getNewTasks(): Observable<TaskPayload> {
    return this.taskSubject.asObservable();
  }
}
