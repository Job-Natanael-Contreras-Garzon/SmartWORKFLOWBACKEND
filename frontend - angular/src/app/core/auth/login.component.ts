import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserProfile } from './auth.service';
import { TenantService } from './tenant.service';
import { CommonModule } from '@angular/common';

/** Estructura real de la respuesta de /api/auth/login del backend */
interface LoginResponse {
  accessToken: string;
  userProfile: UserProfile;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: []
})
export class LoginComponent {
  private fb          = inject(FormBuilder);
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private tenant      = inject(TenantService);
  private router      = inject(Router);

  /** El slug puede venir del TenantService (subdominio o query param) */
  detectedSlug = this.tenant.slug;

  /** Input manual para cuando no hay tenant auto-detectado (dev) */
  orgSlugInput = '';

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  isLoading    = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // En dev: usar el input manual si no hay tenant auto-detectado
    const slug = this.detectedSlug() || (this.orgSlugInput.trim() || null);

    const body = {
      email:    this.loginForm.value.email,
      password: this.loginForm.value.password,
      orgSlug:  slug   // null = SUPER_ADMIN login
    };

    this.http.post<LoginResponse>('/api/auth/login', body).subscribe({
      next: (res) => {
        // Persistir token y perfil de usuario
        this.authService.login({
          token:        res.accessToken,
          role:         res.userProfile.role,
          userId:       res.userProfile.id,
          userName:     res.userProfile.name,
          departmentId: res.userProfile.departmentId ?? undefined,
          orgSlug:      res.userProfile.orgSlug ?? undefined,
          orgName:      res.userProfile.orgName ?? undefined
        });

        // Actualizar TenantService con el slug que devuelve el backend
        if (res.userProfile.orgSlug) {
          this.tenant.setSlug(res.userProfile.orgSlug);
        }

        // Redirigir según rol
        switch (res.userProfile.role) {
          case 'SUPER_ADMIN': this.router.navigate(['/super-admin']); break;
          case 'ADMIN':       this.router.navigate(['/admin']);       break;
          case 'MANAGER':     this.router.navigate(['/manager']);     break;
          case 'OFFICER':     this.router.navigate(['/officer']);     break;
          default:            this.router.navigate(['/track']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message ?? 'Error al iniciar sesión. Verifica tus credenciales.'
        );
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
