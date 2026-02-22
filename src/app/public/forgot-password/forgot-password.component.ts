import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ForgotPasswordFormComponent } from './components/forgot-password-form/forgot-password-form.component';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ForgotPasswordFormComponent],
  templateUrl: './forgot-password.component.html',
  styles: [`
    .glass {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
    }

    .container-custom {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1rem;
    }
  `]
})

export class ForgotPasswordComponent {
  landingUrl = environment.landingUrl;
}
