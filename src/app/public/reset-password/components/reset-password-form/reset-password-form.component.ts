
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-reset-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password-form.component.html',
})
export class ResetPasswordFormComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  showPassword = signal<boolean>(false);
  showPasswordConfirm = signal<boolean>(false);
  token = signal<string>('');

  resetPasswordForm = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    passwordConfirmation: new FormControl('', [Validators.required])
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.token.set(token);
    } else {
      this.errorMessage.set('Token de redefinição inválido ou não fornecido.');
      this.resetPasswordForm.disable();
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  togglePasswordConfirmVisibility() {
    this.showPasswordConfirm.update(value => !value);
  }

  passwordMatchValidator(control: AbstractControl<{ password: string, passwordConfirmation: string }>): ValidationErrors | null {
    const passwordControl = control.get('password');
    const passwordConfirmationControl = control.get('passwordConfirmation');

    if (!passwordControl || !passwordConfirmationControl) return null;
    
    const password = passwordControl?.value;
    const confirm = passwordConfirmationControl?.value;

    if (password && confirm && password !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  handleSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    if (!this.token()) {
      this.errorMessage.set('Token de redefinição não encontrado.');
      return;
    }

    const password = this.resetPasswordForm.get('password')?.value;
    const passwordConfirmation = this.resetPasswordForm.get('passwordConfirmation')?.value;

    if (!password || !passwordConfirmation) return;

    this.isLoading.set(true);

    this.authService.resetPassword({
      password,
      passwordConfirmation,
      token: this.token()
    })
    .pipe(
      finalize(() => this.isLoading.set(false))
    )
    .subscribe({
      next: () => {
        this.successMessage.set('Senha redefinida com sucesso! Redirecionando para o login...');
        this.resetPasswordForm.reset();
        
        setTimeout(() => {
            this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err: HttpErrorResponse) => {
        let errorMessage = 'Ocorreu um erro ao redefinir sua senha.';
        
        if (err.status === 400) {
          errorMessage = 'Dados inválidos ou senhas não conferem.';
        } else if (err.status === 401) {
          errorMessage = 'Token inválido ou expirado. Solicite uma nova redefinição.';
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
