import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-admin.component.html'
})
export class UsersAdminComponent {
  http = inject(HttpClient);
  toastr = inject(ToastrService);
  auth = inject(AuthService);
  router = inject(Router);

  impersonate(userId: string) {
    if (!userId) {
      this.toastr.warning('User ID inválido');
      return;
    }
    
    this.http.post<any>('/api/auth/impersonate', { targetUserId: userId }).subscribe({
      next: (res: any) => {
        // Log them out from normal user and log in as the targeted one
        this.auth.login({ 
          token: res.token, 
          refreshToken: res.refreshToken, 
          role: res.role,
          userId: userId
        } as any);
        this.toastr.success('Has cambiado de identidad exitosamente', 'Impersonado');
        this.router.navigate(['/']);
      },
      error: () => this.toastr.error('No se pudo impersonar al usuario')
    });
  }
}

