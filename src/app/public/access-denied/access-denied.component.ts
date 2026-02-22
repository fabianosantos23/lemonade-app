import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ShieldAlertIcon } from 'lucide-angular';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div class="w-full max-w-md text-center">
        <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <lucide-icon [img]="ShieldAlertIcon" class="h-10 w-10 text-red-600"></lucide-icon>
        </div>
        
        <h1 class="mb-2 text-3xl font-bold text-slate-900">Acesso Negado</h1>
        <p class="mb-8 text-slate-600">
          Você não tem permissão para acessar esta página. Entre em contato com seu administrador se acreditar que isso é um erro.
        </p>
        
        <div class="flex justify-center gap-4">
          <a routerLink="/dashboard" class="rounded-lg bg-slate-900 px-6 py-2.5 font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  `
})
export class AccessDeniedComponent {
  readonly ShieldAlertIcon = ShieldAlertIcon;
}
