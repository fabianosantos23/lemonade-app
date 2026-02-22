
import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { UserSession } from '../../../../core/types/user.types';
import { LoginCredentials } from '../../../../core/types/auth.types';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  // Outputs (novos signals)
  forgotPassword = output<void>();
  loginSuccess = output<UserSession>();

  // Estado local
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false),
  })


  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  handleSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor, preencha todos os campos corretamente.');
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials: LoginCredentials = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!,
      rememberMe: this.loginForm.value.rememberMe!,
    };

    this.isLoading.set(true);

    this.authService.login(credentials)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
      next: (result) => {
        if (!result?.data || !result.data.user) {
          return;
        }

        if (result.data?.user) {
          this.successMessage.set(`Bem-vindo, ${result.data.user.name}!`);
          
          // Delay para mostrar mensagem de sucesso
          setTimeout(() => {
            this.loginSuccess.emit(result.data.user!);
          }, 800);
        }
      },
      error: (err: HttpErrorResponse) => {
        const errorMessage = (err?.message || err?.error?.message || 'Ocorreu um erro inesperado. Tente novamente.') as string;
        this.errorMessage.set(errorMessage);
      }
    });
  }

  onForgotPassword() {
    this.forgotPassword.emit();
  }
}
