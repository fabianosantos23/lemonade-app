import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ProductsService } from '../../../services/products.service';
import { EcommercesService, Ecommerce } from '../../../services/ecommerces.service';
import { GeneratedDescription, GeneratedDescriptionApi, ImprovedDescriptionStatus, Product, ProductHistoryItem, ProductQuickStats, ProductStatus } from '../../../core/types/product.types';
import { EnhanceWithAIModalComponent } from '../products/components/enhance-with-ai-modal/enhance-with-ai-modal.component';
import { ProductFormData, ProductModalComponent } from '../products/components/product-modal/product-modal.component';
import { ProductInfoCardComponent } from "./components/product-info-card/product-info-card.component";
import { ProductGeneratedDescriptionComponent } from "./components/product-generated-description/product-generated-description.component";
import { ProductQuickStatsComponent } from "./components/product-quick-stats/product-quick-stats.component";
import { ProductActionCardComponent } from "./components/product-action-card/product-action-card.component";
import { ProductTimelineComponent } from "./components/product-timeline/product-timeline.component";
import { ProductDescriptionModalComponent } from "./components/product-description-modal/product-description-modal.component";
import { Status } from '../../../core/types/common.types';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule, EnhanceWithAIModalComponent, ProductInfoCardComponent, ProductGeneratedDescriptionComponent, ProductQuickStatsComponent, ProductActionCardComponent, ProductTimelineComponent, ProductDescriptionModalComponent, ProductModalComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private ecommercesService = inject(EcommercesService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  product = signal<Product | null>(null);
  descriptions = signal<GeneratedDescription[]>([]);
  history = signal<ProductHistoryItem[]>([]);
  stats = signal<ProductQuickStats | null>(null);
  ecommerces = signal<Ecommerce[]>([]);

  descriptionViewMode = signal<'grid' | 'list'>('grid');
  editingDescriptionId = signal<string | null>(null);
  editingDescriptionText = signal<string>('');
  selectedDescription = signal<GeneratedDescription | null>(null);
  savingDescriptionId = signal<string | null>(null);

  loadingMain = signal(false);
  loadingDescriptions = signal(false);
  loadingHistory = signal(false);
  loadingStats = signal(false);

  showEnhanceModal = signal(false);
  showDescriptionModal = signal(false);
  showProductModal = signal(false);
  isSavingProduct = signal(false);

  showEmptyState = computed(() => this.descriptions().length === 0);
  showPublishButton = computed(() => this.product()?.status === ProductStatus.ENHANCED);
  canUseAI = computed(() => !!this.product()?.simpleDescription);
  canEdit = computed(() => true);

  private beforeUnloadListener = (event: BeforeUnloadEvent) => {
    if (!this.editingDescriptionId()) return;
    event.preventDefault();
    event.returnValue = '';
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    window.addEventListener('beforeunload', this.beforeUnloadListener);

    this.loadingMain.set(true);
    this.productsService.findById(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loadingMain.set(false);
      },
      error: () => this.loadingMain.set(false)
    });

    this.loadingDescriptions.set(true);
    this.productsService.listDescriptionsByProduct(id).subscribe({
      next: (list) => {
        this.descriptions.set(
          list.map((item, index) => this.mapGeneratedDescription(item, index)),
        );
        this.loadingDescriptions.set(false);
      },
      error: () => this.loadingDescriptions.set(false)
    });

    this.loadingHistory.set(true);
    this.productsService.getHistory(id).subscribe({
      next: (items) => {
        this.history.set(items);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false)
    });

    this.loadingStats.set(true);
    this.productsService.getStats(id).subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loadingStats.set(false);
      },
      error: () => this.loadingStats.set(false)
    });

    this.ecommercesService.getEcommerces().subscribe({
      next: (list) => {
        this.ecommerces.set(list.filter((e) => e.status === Status.ACTIVE));
      },
      error: () => {
        this.ecommerces.set([]);
      }
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.beforeUnloadListener);
  }

  handlePublish(): void {
    if (!this.confirmDiscardUnsavedEdit()) return;
    const product = this.product();
    if (!product) return;
    this.productsService.updateStatus(product.id, ProductStatus.PUBLISHED).subscribe({
      next: (p) => this.product.set(p),
      error: () => {}
    });
  }

  handleDelete(): void {
    if (!this.confirmDiscardUnsavedEdit()) return;
    const product = this.product();
    if (!product) return;
    this.confirmDialog
      .open({
        title: 'Excluir produto',
        message: 'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.productsService.delete(product.id).subscribe({
          next: () => {
            this.toastService.success('Produto excluído com sucesso.');
            void this.router.navigate(['/products']);
          },
          error: () => {
            this.toastService.error('Não foi possível excluir o produto. Tente novamente.');
          },
        });
      });
  }

  handleEdit(): void {
    if (!this.confirmDiscardUnsavedEdit()) return;
    const product = this.product();
    if (!product) return;
    this.showProductModal.set(true);
  }

  handleOpenEnhanceModal(): void {
    if (!this.confirmDiscardUnsavedEdit()) return;
    this.showEnhanceModal.set(true);
  }

  handleEnhanceSubmit(_data: { productId: string; ecommerces: (string | number)[]; generatedDescriptions: GeneratedDescription[] }): void {
    const product = this.product();
    if (!product) {
      this.showEnhanceModal.set(false);
      return;
    }

    this.loadingDescriptions.set(true);
    this.productsService.listDescriptionsByProduct(product.id).subscribe({
      next: (list) => {
        this.descriptions.set(
          list.map((item, index) => this.mapGeneratedDescription(item, index)),
        );
        this.loadingDescriptions.set(false);
        this.showEnhanceModal.set(false);
      },
      error: () => {
        this.loadingDescriptions.set(false);
        this.showEnhanceModal.set(false);
      }
    });
  }

  handleViewModeChange(mode: 'grid' | 'list'): void {
    this.descriptionViewMode.set(mode);
  }

  handleToggleEdit(payload: { id: string; currentText: string }): void {
    this.editingDescriptionId.set(payload.id);
    this.editingDescriptionText.set(payload.currentText);
  }

  handleEditingTextChange(text: string): void {
    this.editingDescriptionText.set(text);
  }

  handleSaveEdit(id: string): void {
    const text = this.editingDescriptionText().trim();
    if (!text) {
      this.toastService.error('A descrição não pode estar vazia.');
      return;
    }

    this.savingDescriptionId.set(id);
    this.productsService.updateDescriptionResult(id, text).subscribe({
      next: (updated) => {
        const next = this.descriptions().map(desc =>
          desc.id === id
            ? {
                ...desc,
                result: updated.result,
                generatedAt: updated.updatedAt ?? updated.createdAt,
              }
            : desc,
        );
        this.descriptions.set(next);
        this.editingDescriptionId.set(null);
        this.editingDescriptionText.set('');
        this.savingDescriptionId.set(null);
        this.toastService.success('Descrição atualizada com sucesso.');
      },
      error: () => {
        this.savingDescriptionId.set(null);
        this.toastService.error('Não foi possível salvar a descrição. Tente novamente.');
      },
    });
  }

  handleCancelEdit(): void {
    this.editingDescriptionId.set(null);
    this.editingDescriptionText.set('');
  }

  handleApprove(id: string): void {
    this.productsService.updateDescriptionStatus(id, ImprovedDescriptionStatus.APPROVED).subscribe({
      next: (updated) => {
        const next: GeneratedDescription[] = this.descriptions().map(desc =>
          desc.id === id
            ? {
                ...desc,
                status: updated.status,
                result: updated.result,
                generatedAt: updated.updatedAt ?? updated.createdAt,
              }
            : desc,
        );
        this.descriptions.set(next);
        this.toastService.success('Descrição aprovada com sucesso.');
      },
      error: () => {},
    });
  }

  handleReject(id: string): void {
    this.confirmDialog
      .open({
        title: 'Reprovar descrição',
        message: 'Tem certeza que deseja reprovar esta descrição?',
        confirmText: 'Reprovar',
        cancelText: 'Cancelar',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.productsService
          .updateDescriptionStatus(id, ImprovedDescriptionStatus.REJECTED)
          .subscribe({
            next: (updated) => {
              const next: GeneratedDescription[] = this.descriptions().map((desc) =>
                desc.id === id
                  ? {
                      ...desc,
                      status: updated.status,
                      result: updated.result,
                      generatedAt: updated.updatedAt ?? updated.createdAt,
                    }
                  : desc,
              );
              this.descriptions.set(next);
              this.toastService.success('Descrição reprovada com sucesso.');
            },
            error: () => {},
          });
      });
  }

  handleOpenDescription(desc: GeneratedDescription): void {
    if (!this.confirmDiscardUnsavedEdit()) return;
    this.selectedDescription.set(desc);
    this.showDescriptionModal.set(true);
  }

  handleSaveDescriptionFromModal(payload: { id: string; description: string }): void {
    const text = payload.description.trim();
    if (!text) {
      this.toastService.error('A descrição não pode estar vazia.');
      return;
    }

    this.savingDescriptionId.set(payload.id);
    this.productsService.updateDescriptionResult(payload.id, text).subscribe({
      next: (updated) => {
        const next = this.descriptions().map(desc =>
          desc.id === payload.id
            ? {
                ...desc,
                result: updated.result,
                generatedAt: updated.updatedAt ?? updated.createdAt,
              }
            : desc,
        );
        this.descriptions.set(next);
        this.savingDescriptionId.set(null);
        this.showDescriptionModal.set(false);
        this.toastService.success('Descrição atualizada com sucesso.');
      },
      error: () => {
        this.savingDescriptionId.set(null);
        this.toastService.error('Não foi possível salvar a descrição. Tente novamente.');
      },
    });
  }

  handleSaveProductFromModal(data: ProductFormData): void {
    const product = this.product();
    if (!product) return;

    const updateDto: { name: string; simpleDescription: string } = {
      name: data.name,
      simpleDescription: data.description,
    };

    this.isSavingProduct.set(true);

    this.productsService
      .update(product.id, { ...updateDto, imageUrl: product.imageUrl ?? null })
      .pipe(
        switchMap((updated) => {
          if (data.image) {
            return this.productsService.uploadImage(updated.id, data.image).pipe(
              switchMap(() => this.productsService.findById(updated.id)),
            );
          }

          return this.productsService.findById(updated.id);
        }),
      )
      .subscribe({
        next: (updated) => {
          this.product.set(updated);
          this.isSavingProduct.set(false);
          this.showProductModal.set(false);
          this.toastService.success('Produto atualizado com sucesso.');
        },
        error: () => {
          this.isSavingProduct.set(false);
          this.toastService.error('Erro ao atualizar produto. Verifique os dados e tente novamente.');
        },
      });
  }

  closeProductModal(): void {
    if (this.isSavingProduct()) return;
    this.showProductModal.set(false);
  }

  private confirmDiscardUnsavedEdit(): boolean {
    if (!this.editingDescriptionId()) return true;
    return window.confirm('Existem alterações não salvas na descrição. Deseja descartá-las?');
  }

  private mapGeneratedDescription(item: GeneratedDescriptionApi, index: number): GeneratedDescription {
    return {
      id: item.id,
      name: `Descrição ${index + 1}`,
      icon: '🛒',
      result: item.result,
      generatedAt: item.createdAt,
      status: item.status,
    };
  }
}
