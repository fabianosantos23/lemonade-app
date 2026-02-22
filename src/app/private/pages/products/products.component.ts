import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Product, ProductStatus, CreateProductDto, UpdateProductDto, GeneratedDescription } from '../../../core/types/product.types';
import { ProductFormData, ProductModalComponent } from './components/product-modal/product-modal.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ProductCardComponent } from "./components/product-card/product-card.component";
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, of } from 'rxjs';
import { ProductsService } from '../../../services/products.service';
import { StoresService } from '../../../services/stores.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    LucideAngularModule, 
    FormsModule, 
    ProductCardComponent, 
    ProductModalComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsPageComponent implements OnInit {
  private productsService = inject(ProductsService);
  private storesService = inject(StoresService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  Math = Math;
  products = this.productsService.products;
  stats = this.productsService.stats;
  loading = signal(false);
  storeId = signal<string | null>(null);

  searchQuery = signal('');
  statusFilter = signal<ProductStatus | null>(null);
  sortBy = signal('newest');

  // Modal States
  showProductModal = signal(false);
  showEnhanceModal = signal(false);
  selectedProduct = signal<Product | null>(null);
  isSavingProduct = signal(false);
  pagination = signal({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  statusFilters = [
    { label: 'Todos', value: null },
    { label: '📝 Básicos', value: ProductStatus.ACTIVE },
    { label: '✨ Melhorados', value: ProductStatus.ENHANCED },
    { label: '✅ Publicados', value: ProductStatus.PUBLISHED },
  ];

  filteredProducts = computed(() => {
    let list = [...this.products()];

    // Search
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(p => p.name.toLowerCase().includes(query));
    }

    // Status Filter
    const status = this.statusFilter();
    if (status) {
      list = list.filter(p => p.status === status);
    }

    // Sort
    const sort = this.sortBy();
    list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  });


  setStatusFilter(value: ProductStatus | null): void {
    this.statusFilter.set(value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set(null);
    this.sortBy.set('newest');
  }

  openNewProductModal(): void {
    this.selectedProduct.set(null);
    this.showProductModal.set(true);
  }

  handleEnhance(product: Product): void {
    this.selectedProduct.set(product);
    this.showEnhanceModal.set(true);
  }

  handleViewDetails(product: Product): void {
    void this.router.navigate(['/product', product.id]);
  }

  handleEdit(product: Product): void {
    this.selectedProduct.set(product);
    this.showProductModal.set(true);
  }

  handleSaveProduct(data: ProductFormData): void {
    this.isSavingProduct.set(true);
    const product = this.selectedProduct();

    if (product) {
      // Update
      const updateDto: UpdateProductDto = {
        name: data.name,
        simpleDescription: data.description,
      };

      this.productsService.update(product.id, updateDto).pipe(
        switchMap((updatedProduct) => {
          if (data.image) {
            return this.productsService.uploadImage(updatedProduct.id, data.image);
          }
          return of(null);
        })
      ).subscribe({
        next: () => {
          this.toastService.success('Produto atualizado com sucesso!');
          this.closeProductModal();
          this.loadProducts();
        },
        error: (err: unknown) => {
          console.error('Error updating product:', err);
          this.toastService.error('Erro ao atualizar produto. Verifique os dados e tente novamente.');
          this.isSavingProduct.set(false);
        }
      });
    } else {
      // Create
      const createDto: CreateProductDto = {
        name: data.name,
        simpleDescription: data.description,
        storeId: data.storeId,
      };

      this.productsService.create(createDto).pipe(
        switchMap((createdProduct) => {
          if (data.image) {
            return this.productsService.uploadImage(createdProduct.id, data.image);
          }
          return of(null);
        })
      ).subscribe({
        next: () => {
          this.toastService.success('Produto criado com sucesso!');
          this.closeProductModal();
          this.loadProducts();
        },
        error: (err: unknown) => {
          let message = 'Erro ao criar produto. Verifique os dados e tente novamente.';
          if (typeof err === 'object' && err !== null) {
            const maybeError = (err as { error?: { message?: unknown } }).error;
            if (maybeError && typeof maybeError.message === 'string') {
              message = maybeError.message;
            }
          }
          this.toastService.error(message);
          this.isSavingProduct.set(false);
        }
      });
    }
  }

  closeProductModal(): void {
    this.showProductModal.set(false);
    this.selectedProduct.set(null);
    this.isSavingProduct.set(false);
  }

  handleEnhanceSubmit(_data: { productId: string; ecommerces: (string | number)[]; generatedDescriptions: GeneratedDescription[] }): void {
    // Integração futura com endpoint para salvar descrições geradas
    this.closeEnhanceModal();
  }

  closeEnhanceModal(): void {
    this.showEnhanceModal.set(false);
    this.selectedProduct.set(null);
  }

  handleDelete(product: Product): void {
    this.productsService.delete(product.id).subscribe();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const storeIdFromQuery = params['storeId'] as string | null;
      if (storeIdFromQuery) {
        this.loadProducts();
      } else {
        this.fetchDefaultStore();
      }
    });
  }

  fetchDefaultStore() {
    this.loading.set(true);
    this.storesService.getStores({ limit: 1 }).subscribe({
      next: (stores) => {
        if (stores && stores.length > 0) {
          this.loadProducts();
        } else {
          this.loading.set(false);
          this.toastService.warning('Nenhuma loja encontrada. Crie uma loja primeiro.');
          void this.router.navigate(['/stores']);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Erro ao buscar lojas.');
      }
    });
  }

  loadProducts() {
    this.loading.set(true);
    this.productsService.findAll({ 
      page: this.pagination().page, 
      limit: this.pagination().limit,
      search: this.searchQuery() || undefined
    }).subscribe({
      next: (response) => {
        this.pagination.update(p => ({
          ...p,
          total: response.total,
          totalPages: response.totalPages,
          page: response.page
        }));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Erro ao carregar produtos.');
      }
    });
  }

  handlePageChange(page: number) {
    this.pagination.update(p => ({
      ...p,
      page,
    }));
    this.loadProducts();
  }
}
