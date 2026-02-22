import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductHistoryItem, ProductHistoryTimelineItem, ProductHistoryType } from '../../../../../core/types/product.types';
import { ArchiveIcon, ArrowLeftRightIcon, CheckIcon, LucideIconData, SparklesIcon, SquarePenIcon, LucideAngularModule, TrashIcon } from 'lucide-angular';
import { TooltipDirective } from '../../../../../core/directives/tooltip.directive';

@Component({
  selector: 'app-product-timeline',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TooltipDirective],
  templateUrl: './product-timeline.component.html',
  styleUrl: './product-timeline.component.scss',
  host: {
    class: 'rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTimelineComponent {
  createdAt = input<string | Date>('');
  history = input<ProductHistoryItem[]>([]);

  showAllHistory = signal(false);
  colorMap = new Map<ProductHistoryType, { color: string; icon: LucideIconData, iconSize: number, iconColor: string }>([
    [ProductHistoryType.CREATE, {
      color: 'bg-green-100',
      icon: CheckIcon,
      iconSize: 16,
      iconColor: '#16a34a',
    }],
    [ProductHistoryType.EDIT, {
      color: 'bg-slate-600',
      icon: SquarePenIcon,
      iconSize: 16,
      iconColor: 'white',
    }],
    [ProductHistoryType.ENHANCED_DESCRIPTION, {
      color: 'bg-violet-600',
      icon: SparklesIcon,
      iconSize: 16,
      iconColor: 'white',
    }],
    [ProductHistoryType.STATUS_CHANGE, {
      color: 'bg-green-600',
      icon: ArrowLeftRightIcon,
      iconSize: 16,
      iconColor: 'white',
    }],
    [ProductHistoryType.DELETE, {
      color: 'bg-red-600',
      icon: TrashIcon,
      iconSize: 16,
      iconColor: 'white',
    }],
    [ProductHistoryType.ARCHIVE, {
      color: 'bg-yellow-600',
      icon: ArchiveIcon,
      iconSize: 16,
      iconColor: 'black',
    }],
  ]);

  sortedHistory = computed<ProductHistoryTimelineItem[]>(() => {
    const items = this.history() ?? [];
    const history: ProductHistoryTimelineItem[] = [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ).map(item => {
      return {
      ...(this.colorMap.get(item.type) || {
        color: '',
        icon: CheckIcon,
        iconSize: 16,
        iconColor: 'text-white',
      }),
      id: item.id,
      type: item.type,
      createdAt: item.createdAt,
      title: item.title,
      message: item.message,
      formattedMessage: item.formattedMessage,
      createdByName: item.createdByName,
    }
    });
    history.push({
      ...(this.colorMap.get(ProductHistoryType.CREATE) || {
        color: '',
        icon: CheckIcon,
        iconSize: 16,
        iconColor: 'text-white',
      }),
      id: 'create',
      type: ProductHistoryType.CREATE,
      createdAt: this.createdAt(),
      title: 'Producto Criado',
      message: 'O produto foi criado',
      formattedMessage: 'The product was created',
      createdByName: 'Sistema',
    });

    return history;
  });

  visibleHistory = computed<ProductHistoryTimelineItem[]>(() => {
    const items = this.sortedHistory();
    if (this.showAllHistory() || items.length <= 3) return items;
    return items.slice(0, 3);
  });

  registeredClick = output<void>();
  enhancedClick = output<void>();
  publishedClick = output<void>();

  toggleShowAll(): void {
    this.showAllHistory.update(value => !value);
  }
}
