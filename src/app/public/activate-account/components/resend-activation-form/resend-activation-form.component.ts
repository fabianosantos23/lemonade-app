import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-resend-activation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resend-activation-form.component.html',
})
export class ResendActivationFormComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  resendForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  handleSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.resendForm.invalid) {
      this.errorMessage.set('Por favor, preencha um email válido');
      return;
    }

    const email = this.resendForm.get('email')?.value;
    if (!email) return;

    this.isLoading.set(true);

    this.authService.resendActivation(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const message = res?.data?.message || 'Email enviado com sucesso! Verifique sua caixa de entrada e spam.';
        this.successMessage.set(message);
        this.resendForm.reset();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set((err.error?.message || err.error?.error || 'Erro ao enviar email. Tente novamente.') as string);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
