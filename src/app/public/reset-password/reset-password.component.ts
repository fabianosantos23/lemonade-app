
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResetPasswordFormComponent } from './components/reset-password-form/reset-password-form.component';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ResetPasswordFormComponent],
  templateUrl: './reset-password.component.html',
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .glass {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      animation: fadeIn 0.5s ease-out forwards;
    }

    .container-custom {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1rem;
    }
  `]
})
export class ResetPasswordComponent {
  landingUrl = environment.landingUrl;
}
