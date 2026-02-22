import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductQuickStats } from '../../../../../core/types/product.types';

@Component({
  selector: 'app-product-quick-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-quick-stats.component.html',
  styleUrl: './product-quick-stats.component.scss',
  host: {
    class: 'rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductQuickStatsComponent {
  stats = input<ProductQuickStats | null>(null);

  statClick = output<keyof ProductQuickStats>();
}
