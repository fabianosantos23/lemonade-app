import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-forgot-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password-form.component.html',
})
export class ForgotPasswordFormComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  handleSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const email = this.forgotPasswordForm.get('email')?.value;

    if (!email) return;

    this.isLoading.set(true);

    this.authService.requestPasswordReset(email)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
      next: () => {
        this.successMessage.set('Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.');
        this.forgotPasswordForm.reset();
        
        setTimeout(() => {
            this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err: HttpErrorResponse) => {
        let errorMessage = 'Ocorreu um erro ao processar sua solicitação.';
        
        if (err.status === 404) {
          errorMessage = 'Usuário não encontrado.';
        } else if (err.status === 400) {
          errorMessage = 'Email inválido.';
        } else if (err.status === 429) {
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
        } else if (err?.message) {
          errorMessage = err?.message;
        } else if (err?.error?.message) {
          errorMessage = err.error.message as string;
        }

        this.errorMessage.set(errorMessage);
      }
    });
  }
}
