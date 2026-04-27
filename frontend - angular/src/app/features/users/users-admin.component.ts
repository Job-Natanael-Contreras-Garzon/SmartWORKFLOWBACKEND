import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';
import { UserService, User } from '../../core/api/user.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-admin.component.html'
})
export class UsersAdminComponent implements OnInit {
  private userService = inject(UserService);
  private toastr = inject(ToastrService);
  private auth = inject(AuthService);
  private router = inject(Router);

  users = signal<User[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Error al cargar la lista de usuarios');
        this.isLoading.set(false);
      }
    });
  }

  impersonate(userId: string) {
    if (!userId) {
      this.toastr.warning('User ID inválido');
      return;
    }
    
    this.userService.impersonate(userId).subscribe({
      next: (res: any) => {
        // En backend real res suele traer { accessToken, userProfile }
        // Pero como el usuario pidió NO modificar auth.service ni login.component,
        // intentaremos mapear lo que el login() espera actualmente.
        // ADVERTENCIA: res.accessToken vs res.token mismatch detectado en el plan anterior,
        // pero aquí seguiremos la estructura que auth.service espera hoy.
        this.auth.login({ 
          token: res.accessToken || res.token, 
          role: res.userProfile?.role || res.role,
          userId: res.userProfile?.id || userId,
          userName: res.userProfile?.name || 'Impersonated User',
          orgSlug: res.userProfile?.orgSlug,
          orgName: res.userProfile?.orgName
        });
        
        this.toastr.success('Has cambiado de identidad exitosamente', 'Impersonado');
        this.router.navigate(['/']);
      },
      error: () => this.toastr.error('No se pudo impersonar al usuario')
    });
  }
}
