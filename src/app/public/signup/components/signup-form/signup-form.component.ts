import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { CreateUserData } from '../../../../core/types/auth.types';
import { CustomValidators } from '../../../../core/validators/custom.validators';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup-form.component.html',
})
export class SignupFormComponent {
  private authService = inject(AuthService);

  signupSuccess = output<void>();

  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  signupForm = new FormGroup({
    companyName: new FormControl('', [Validators.required]),
    cnpj: new FormControl('', [Validators.required, Validators.minLength(8)]),
    responsibleName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    whatsapp: new FormControl('', [Validators.pattern(/^\d{10,11}$/)]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
    acceptTerms: new FormControl(false, [Validators.requiredTrue]),
  }, { validators: CustomValidators.matchPassword('password', 'confirmPassword') });

  formatCNPJInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 14) {
      value = value.substring(0, 14);
    }

    if (value.length <= 14) {
      // Formatação simples de CNPJ (00.000.000/0000-00) ou CPF (000.000.000-00)
      // Aqui vamos focar na formatação de CNPJ que é o padrão do placeholder
      if (value.length > 11) {
          value = value.replace(/^(\d{2})(\d)/, '$1.$2');
          value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
          value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
          value = value.replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        // Formata CPF
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      }
    }
    
    input.value = value;
    this.signupForm.get('cnpj')?.setValue(value, { emitEvent: false });
  }

  handleSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.signupForm.invalid) {
      this.errorMessage.set('Por favor, preencha todos os campos corretamente.');
      this.signupForm.markAllAsTouched();
      return;
    }

    const formData = this.signupForm.value;

    const userData: CreateUserData = {
      companyName: formData.companyName!,
      cnpj: formData.cnpj!,
      responsibleName: formData.responsibleName!,
      email: formData.email!,
      whatsapp: formData.whatsapp || undefined,
      password: formData.password!,
      acceptedTerms: formData.acceptTerms!,
    };

    this.isLoading.set(true);

    this.authService.signup(userData)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
      next: (result) => {
        if (result) {
          this.successMessage.set('Cadastro realizado com sucesso!');
          this.signupForm.reset();
          
          setTimeout(() => {
            this.signupSuccess.emit();
          }, 3000);
        }
      },
      error: (err: HttpErrorResponse) => {
         const errorMessage = (err?.message || 'Erro ao realizar cadastro.');
         this.errorMessage.set(errorMessage);
      }
    });
  }
}
