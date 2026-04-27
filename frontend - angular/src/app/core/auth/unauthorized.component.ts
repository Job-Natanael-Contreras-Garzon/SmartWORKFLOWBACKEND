import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  templateUrl: './unauthorized.component.html'
})
export class UnauthorizedComponent {
  private router = inject(Router);
  
  get incidentId() {
    return "AUTH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
