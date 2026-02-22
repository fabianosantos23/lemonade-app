import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SignupFormComponent } from './components/signup-form/signup-form.component';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, SignupFormComponent],
  templateUrl: './signup.component.html',
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
export class SignupComponent {
  private router = inject(Router);

  landingUrl = environment.landingUrl;

  handleSignupSuccess() {
    this.router.navigate(['/dashboard']);
  }
}
