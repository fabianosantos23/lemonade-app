
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { UserSession, Role } from '../../core/types/user.types';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private router = inject(Router);

  landingUrl = environment.landingUrl;

  handleLoginSuccess(user: UserSession) {
    if (user?.companies.length > 1) {
      this.router.navigate(['/auth/select-company']);
      return;
    }
    // Lógica de redirecionamento
    const redirectPath = localStorage.getItem('redirect_after_login');
    if (redirectPath) {
      localStorage.removeItem('redirect_after_login');
      this.router.navigateByUrl(redirectPath);
      return;
    }

    if (user.role === Role.SUPERADMIN) {
      this.router.navigate(['/dashboard/superadmin']);
      return
    }

    this.router.navigate(['/dashboard']);
  }

  handleForgotPassword() {
    this.router.navigate(['/auth/esqueci-senha']);
  }
}
