import { ChangeDetectionStrategy, Component, computed, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductStatus } from '../../../../../core/types/product.types';
import { ConfirmDialogService } from '../../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  product = input.required<Product>();
  ProductStatus = ProductStatus;

  enhance = output<Product>();
  viewDetails = output<Product>();
  edit = output<Product>();
  delete = output<Product>();

  showMenu = signal(false);
  private confirmDialog = inject(ConfirmDialogService);

  statusClasses = computed(() => {
    const classes = {
      [ProductStatus.ACTIVE]: "bg-amber-100 text-amber-700",
      [ProductStatus.ENHANCED]: "bg-blue-100 text-blue-700",
      [ProductStatus.PUBLISHED]: "bg-green-100 text-green-700",
    };
    return classes[this.product().status];
  });

  statusLabel = computed(() => {
    const labels = {
      [ProductStatus.ACTIVE]: "📝 Cadastro Básico",
      [ProductStatus.ENHANCED]: "✨ Melhorado pela IA",
      [ProductStatus.PUBLISHED]: "✅ Publicado",
    };
    return labels[this.product().status];
  });

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  handleEdit(): void {
    this.showMenu.set(false);
    this.edit.emit(this.product());
  }

  handleDelete(): void {
    this.showMenu.set(false);
    this.confirmDialog.open({
      title: 'Excluir produto',
      message: `Deseja realmente excluir o produto "${this.product().name}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.delete.emit(this.product());
      }
    });
  }
}
