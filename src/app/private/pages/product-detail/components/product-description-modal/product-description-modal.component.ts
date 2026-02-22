import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneratedDescription, ImprovedDescriptionStatus } from '../../../../../core/types/product.types';

@Component({
  selector: 'app-product-description-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-description-modal.component.html',
  styleUrl: './product-description-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDescriptionModalComponent {
  isOpen = input<boolean>(false);
  description = input<GeneratedDescription | null>(null);

  close = output<void>();
  approve = output<string>();
  reject = output<string>();
  save = output<{ id: string; description: string }>();

  isEditing = signal(false);
  editedText = signal('');
  copied = signal(false);
  ImprovedDescriptionStatus = ImprovedDescriptionStatus;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open) {
        this.isEditing.set(false);
        this.copied.set(false);
        const desc = this.description();
        this.editedText.set(desc?.result ?? '');
      }
    });
  }

  countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  countLines(text: string): number {
    return text.split('\n').length;
  }

  handleApprove(): void {
    const desc = this.description();
    if (!desc) return;
    this.approve.emit(desc.id);
  }

  handleReject(): void {
    const desc = this.description();
    if (!desc) return;
    this.reject.emit(desc.id);
  }

  startEdit(): void {
    const desc = this.description();
    this.editedText.set(desc?.result ?? '');
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editedText.set('');
  }

  handleSave(): void {
    const desc = this.description();
    if (!desc) return;
    this.save.emit({ id: desc.id, description: this.editedText() });
    this.isEditing.set(false);
  }

  handleCopy(): void {
    const desc = this.description();
    if (!desc) return;
    if (!navigator?.clipboard) return;
    void navigator.clipboard.writeText(desc.result).then(
      () => {
        this.copied.set(true);
        setTimeout(() => {
          this.copied.set(false);
        }, 2000);
      },
      () => {},
    );
  }

  onEditedTextInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.editedText.set(value);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
