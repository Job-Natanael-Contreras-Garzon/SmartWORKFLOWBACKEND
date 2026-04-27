import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { WebsocketService, NotificationPayload } from '../../../core/websocket/websocket.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  notifications: NotificationPayload[] = [];
  unreadCount = 0;
  dropdownOpen = false;

  constructor(
    public authService: AuthService,
    private websocketService: WebsocketService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.authService.getToken()) {
      this.websocketService.connect();
      
      this.websocketService.getNotifications().subscribe(notification => {
        this.notifications.unshift(notification);
        if (!notification.read) {
          this.unreadCount++;
          this.toastr.info(`Nueva Tarea: ${notification.message}`, notification.title, {
            timeOut: 5000,
            progressBar: true,
          });
        }
      });

      this.websocketService.getNewTasks().subscribe(task => {
        this.toastr.success(`Una nueva tarea ha entrado al departamento: ${task.activityName}`, 'Nueva Tarea Dpto', {
          timeOut: 5000,
          progressBar: true,
        });
      });
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  markAsRead(notification: NotificationPayload): void {
    if (!notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      // Optional: Call your backend to mark as read API
      this.dropdownOpen = false; // close on click optionally
    }
  }

  logout(): void {
    this.authService.logout();
    this.websocketService.disconnect();
  }
}
