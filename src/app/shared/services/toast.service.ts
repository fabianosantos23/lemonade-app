import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

export interface ToastConfig {
  duration?: number;
  dismissible?: boolean;
  onClose?: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  config: ToastConfig;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  readonly position = signal<ToastPosition>('top-right');
  
  private readonly DEFAULT_DURATION = 5000;
  private readonly MAX_TOASTS = 5;

  setPosition(position: ToastPosition) {
    this.position.set(position);
  }

  success(message: string, config?: ToastConfig) {
    this.show(message, 'success', config);
  }

  error(message: string, config?: ToastConfig) {
    this.show(message, 'error', config);
  }

  warning(message: string, config?: ToastConfig) {
    this.show(message, 'warning', config);
  }

  info(message: string, config?: ToastConfig) {
    this.show(message, 'info', config);
  }

  show(message: string, type: ToastType, config: ToastConfig = {}) {
    const id = crypto.randomUUID();
    const toast: Toast = {
      id,
      message,
      type,
      config: {
        duration: config.duration ?? this.DEFAULT_DURATION,
        dismissible: config.dismissible ?? true,
        onClose: config.onClose,
      }
    };

    this.toasts.update(current => {
      // Limit max toasts, remove oldest if needed
      const updated = [toast, ...current];
      return updated.slice(0, this.MAX_TOASTS);
    });

    if (toast.config.duration && toast.config.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, toast.config.duration);
    }
  }

  remove(id: string) {
    const toast = this.toasts().find(t => t.id === id);
    if (toast?.config.onClose) {
      toast.config.onClose();
    }
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear() {
    this.toasts.set([]);
  }
}
