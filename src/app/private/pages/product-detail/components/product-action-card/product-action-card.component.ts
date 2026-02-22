import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-action-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-action-card.component.html',
  styleUrl: './product-action-card.component.scss',
  host: {
    class: 'rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductActionCardComponent {
  showPublishButton = input<boolean>(false);
  canEdit = input<boolean>(true);
  canUseAI = input<boolean>(true);

  edit = output<void>();
  generateAI = output<void>();
  publish = output<void>();
  delete = output<void>();
 
  handleEditClick(): void {
    if (!this.canEdit()) return;
    this.edit.emit();
  }

  handleGenerateAIClick(): void {
    if (!this.canUseAI()) return;
    this.generateAI.emit();
  }
}
