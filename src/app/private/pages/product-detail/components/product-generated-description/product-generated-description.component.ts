import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneratedDescription, ImprovedDescriptionStatus } from '../../../../../core/types/product.types';

@Component({
  selector: 'app-product-generated-description',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-generated-description.component.html',
  styleUrl: './product-generated-description.component.scss',
  host: {
    class: 'rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGeneratedDescriptionComponent {
  descriptions = input<GeneratedDescription[] | null>(null);
  viewMode = input<'grid' | 'list'>('grid');
  approvalRate = input<number | null>(null);
  editingDescriptionId = input<string | null>(null);
  editingDescriptionText = input<string>('');
  savingDescriptionId = input<string | null>(null);

  viewModeChange = output<'grid' | 'list'>();
  openDescription = output<GeneratedDescription>();
  approve = output<string>();
  reject = output<string>();
  toggleEdit = output<{ id: string; currentText: string }>();
  saveEdit = output<string>();
  cancelEdit = output<void>();
  editingTextChange = output<string>();
  generateWithAI = output<void>();
  ImprovedDescriptionStatus = ImprovedDescriptionStatus;

  copiedDescriptionId = signal<string | null>(null);

  editingTextChangeHandler(event: Event) {
    const text = (event.target as HTMLTextAreaElement).value;
    this.editingTextChange.emit(text);
  }

  handleCopyClick(text: string, id: string): void {
    if (navigator?.clipboard) {
      void navigator.clipboard.writeText(text).then(
        () => {
          this.copiedDescriptionId.set(id);
          setTimeout(() => {
            if (this.copiedDescriptionId() === id) {
              this.copiedDescriptionId.set(null);
            }
          }, 2000);
        }
      );
      return;
    }
  }
}
