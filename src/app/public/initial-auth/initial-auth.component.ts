import { Component, OnInit, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { catchError, of, timeout } from 'rxjs';

@Component({
  selector: 'app-initial-auth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div class="flex flex-col items-center space-y-4">
        <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p class="text-gray-600 font-medium animate-pulse">Verificando autenticação...</p>
        
        @if (showLongWaitMessage()) {
          <p class="text-sm text-gray-400 mt-2">Isso está demorando mais que o esperado...</p>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class InitialAuthComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  showLongWaitMessage = signal(false);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Aguarda um breve momento para garantir que o ambiente do navegador esteja estável
      setTimeout(() => {
        this.checkAuth();
      }, 500); // 500ms delay inicial
      
      // Feedback visual se demorar muito
      setTimeout(() => {
        this.showLongWaitMessage.set(true);
      }, 5000);
    }
  }

  private checkAuth() {
    const returnUrl: string = this.route.snapshot.queryParams['returnUrl'] || '/';

    this.authService.getProfile()
      .pipe(
        timeout(10000), // Timeout de 10 segundos
        catchError(err => {
          console.warn('Falha na verificação de autenticação:', err);
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response?.data?.user) {
            // Sucesso: Redireciona para a URL original
            this.router.navigateByUrl(returnUrl);
          } else {
            // Falha: Redireciona para login
            this.router.navigate(['/auth/login'], { queryParams: { returnUrl } });
          }
        },
        error: () => {
          // Erro inesperado (timeout, etc)
          this.router.navigate(['/auth/login'], { queryParams: { returnUrl } });
        }
      });
  }
}
