import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircleIcon, XCircleIcon, AlertCircleIcon, InfoIcon, XIcon } from 'lucide-angular';
import { ToastService, ToastType } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div 
      class="fixed z-50 flex flex-col gap-2 p-4 transition-all duration-300 pointer-events-none"
      [ngClass]="positionClasses()"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-top-2 fade-in duration-300"
          [ngClass]="getToastClasses(toast.type)"
          role="alert"
        >
          <!-- Icon -->
          <div class="flex-shrink-0">
            @switch (toast.type) {
              @case ('success') { <lucide-icon [img]="CheckCircleIcon" class="h-5 w-5 text-green-500"></lucide-icon> }
              @case ('error') { <lucide-icon [img]="XCircleIcon" class="h-5 w-5 text-red-500"></lucide-icon> }
              @case ('warning') { <lucide-icon [img]="AlertCircleIcon" class="h-5 w-5 text-amber-500"></lucide-icon> }
              @case ('info') { <lucide-icon [img]="InfoIcon" class="h-5 w-5 text-blue-500"></lucide-icon> }
            }
          </div>

          <!-- Content -->
          <div class="flex-1 pt-0.5">
            <p class="text-sm font-medium">{{ toast.message }}</p>
          </div>

          <!-- Close Button -->
          @if (toast.config.dismissible) {
            <button 
              (click)="toastService.remove(toast.id)"
              class="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1"
              [ngClass]="getCloseButtonClasses(toast.type)"
              aria-label="Fechar notificação"
            >
              <lucide-icon [img]="XIcon" class="h-4 w-4"></lucide-icon>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  readonly CheckCircleIcon = CheckCircleIcon;
  readonly XCircleIcon = XCircleIcon;
  readonly AlertCircleIcon = AlertCircleIcon;
  readonly InfoIcon = InfoIcon;
  readonly XIcon = XIcon;

  positionClasses = computed(() => {
    const pos = this.toastService.position();
    switch (pos) {
      case 'top-right': return 'top-20 right-0 items-end';
      case 'top-left': return 'top-20 left-0 items-start';
      case 'top-center': return 'top-20 left-1/2 -translate-x-1/2 items-center';
      case 'bottom-right': return 'bottom-0 right-0 items-end flex-col-reverse';
      case 'bottom-left': return 'bottom-0 left-0 items-start flex-col-reverse';
      case 'bottom-center': return 'bottom-0 left-1/2 -translate-x-1/2 items-center flex-col-reverse';
      default: return 'top-0 right-0 items-end';
    }
  });

  getToastClasses(type: ToastType): string {
    switch (type) {
      case 'success': return 'bg-white border-green-200 text-slate-800 ring-1 ring-green-100'; // Modern clear look
      case 'error': return 'bg-white border-red-200 text-slate-800 ring-1 ring-red-100';
      case 'warning': return 'bg-white border-amber-200 text-slate-800 ring-1 ring-amber-100';
      case 'info': return 'bg-white border-blue-200 text-slate-800 ring-1 ring-blue-100';
    }
  }

  getCloseButtonClasses(type: ToastType): string {
    switch (type) {
      case 'success': return 'text-green-500 focus:ring-green-500';
      case 'error': return 'text-red-500 focus:ring-red-500';
      case 'warning': return 'text-amber-500 focus:ring-amber-500';
      case 'info': return 'text-blue-500 focus:ring-blue-500';
    }
  }
}
