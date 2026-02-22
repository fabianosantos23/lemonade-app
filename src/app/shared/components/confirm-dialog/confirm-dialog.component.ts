import { Component, ChangeDetectionStrategy, input, output, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, XIcon } from 'lucide-angular';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEsc()'
  },
  template: `
    <div
      class="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      [class.opacity-0]="!open()"
      [class.opacity-100]="open()"
      style="transition: opacity 150ms ease"
    >
      <div
        class="absolute inset-0 bg-black/50"
        (click)="onCancel()"
      ></div>

      <div
        class="relative w-full max-w-md transform rounded-2xl border border-slate-200 bg-white shadow-2xl"
        [class.scale-95]="!open()"
        [class.translate-y-2]="!open()"
        style="transition: transform 150ms ease"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div class="flex items-start justify-between border-b border-slate-200 p-4">
          <h2 id="dialog-title" class="text-lg font-semibold text-slate-800">{{ title() }}</h2>
          <button type="button" class="rounded p-2 text-slate-500 hover:bg-slate-100" (click)="onCancel()" aria-label="Fechar">
            <lucide-angular [img]="XIcon" class="h-5 w-5"></lucide-angular>
          </button>
        </div>

        <div class="p-4">
          <p id="dialog-description" class="text-sm text-slate-600">{{ message() }}</p>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-slate-200 p-4">
          <button
            type="button"
            class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white hover:shadow-sm"
            (click)="onCancel()"
          >
            {{ cancelText() }}
          </button>
          <button
            #confirmBtn
            type="button"
            class="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:shadow-lg hover:shadow-blue-500/30"
            (click)="onConfirm()"
            autofocus
          >
            {{ confirmText() }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  readonly XIcon = XIcon;

  title = input<string>('Confirmar ação');
  message = input<string>('Tem certeza que deseja continuar?');
  confirmText = input<string>('Confirmar');
  cancelText = input<string>('Cancelar');

  confirm = output<void>();
  cancel = output<void>();

  open = signal(true);
  confirmBtn = viewChild<ElementRef<HTMLButtonElement>>('confirmBtn');

  onEsc() {
    this.onCancel();
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  constructor() {
    queueMicrotask(() => this.confirmBtn()?.nativeElement?.focus());
  }
}

