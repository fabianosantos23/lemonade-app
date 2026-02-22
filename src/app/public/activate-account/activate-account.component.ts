import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ResendActivationFormComponent } from './components/resend-activation-form/resend-activation-form.component';

type ActivationState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [CommonModule, ResendActivationFormComponent],
  templateUrl: './activate-account.component.html',
})
export class ActivateAccountComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  activationState = signal<ActivationState>('loading');
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.activationState.set('error');
      this.errorMessage.set('Link de ativação inválido. Nenhum token foi fornecido.');
      return;
    }

    this.authService.activateAccount(token).subscribe({
      next: (res) => {
        this.activationState.set('success');
        const message = res.message || 'Você já pode fazer login com suas credenciais.';
        this.successMessage.set(message);

        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.activationState.set('error');
        this.errorMessage.set((err.error?.message || err.error?.error || 'Erro ao ativar conta. Tente novamente.') as string);
      }
    });
  }
}
