import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductStatus } from '../../../../../core/types/product.types';
import { Status } from '../../../../../core/types/common.types';

@Component({
  selector: 'app-product-info-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-info-card.component.html',
  styleUrl: './product-info-card.component.scss',
  host: {
    class: 'rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm',
    '(click)': 'handleCardClick()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductInfoCardComponent {
  product = input<Product | null>(null);
  title = input<string>('Informações Básicas');
  createdAt = input<string>('');
  
  cardClick = output<Product | null>();
  
  statusClasses = computed(() => {
    switch (this.product()?.status) {
      case ProductStatus.ACTIVE:
        return 'text-emerald-600';
      case ProductStatus.ENHANCED:
        return 'text-red-600';
      case ProductStatus.PUBLISHED:
        return 'text-red-600';
      default:
        return '';
    }
  });
  statusLabel = computed(() => {
    if (this.product()?.status === ProductStatus.ACTIVE) {
      return 'Ativo';
    } else if (this.product()?.status === ProductStatus.ENHANCED) {
      return 'Aprimorado';
    } else if (this.product()?.status === ProductStatus.PUBLISHED) {
      return 'Publicado';
    } else {
      return '';
    }
  });
  
  handleCardClick(): void {
    this.cardClick.emit(this.product());
  }
}
