import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { timeout, retry } from 'rxjs';
import { LucideAngularModule, SearchIcon, PlusIcon, StoreIcon, ShoppingBagIcon, LayersIcon, MoreVerticalIcon, XIcon, UploadIcon, Trash2Icon, AlertCircleIcon, ExternalLinkIcon, ImagePlusIcon } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { Store } from '../../../core/types/store.types';
import { StoreModalComponent, StoreFormData } from './components/store-modal/store-modal.component';
import { StoresService } from '../../../services/stores.service';
import { EcommercesService, Ecommerce } from '../../../services/ecommerces.service';
import { ToastService } from '../../../shared/services/toast.service';
import { environment } from '../../../environment/environment';
import { Status } from '../../../core/types/common.types';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, StoreModalComponent],
  templateUrl: './stores.component.html',
  styleUrl: './stores.component.scss'
})
export class StoresComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private storesService = inject(StoresService);
  private ecommercesService = inject(EcommercesService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  Status = Status;
  stores = signal<Store[]>([]);
  ecommerces = signal<Ecommerce[]>([]);
  showStoreModal = signal(false);
  editingStore = signal<Store | null>(null);
  productCounts = signal<Record<string, number>>({});

  // Lucide Icons
  readonly SearchIcon = SearchIcon;
  readonly PlusIcon = PlusIcon;
  readonly StoreIcon = StoreIcon;
  readonly ShoppingBagIcon = ShoppingBagIcon;
  readonly LayersIcon = LayersIcon;
  readonly MoreVerticalIcon = MoreVerticalIcon;
  readonly XIcon = XIcon;
  readonly UploadIcon = UploadIcon;
  readonly Trash2Icon = Trash2Icon;
  readonly AlertCircleIcon = AlertCircleIcon;
  readonly ExternalLinkIcon = ExternalLinkIcon;
  readonly ImagePlusIcon = ImagePlusIcon;

  isLoading = signal(false);
  isSaving = signal(false);
  uploadProgress = signal(0);

  currentUser = this.authService.currentUser;

  activeStoresCount = computed(() => 
    this.stores().filter((e) => e.status === Status.ACTIVE).length
  );

  totalEcommercesCount = computed(() => {
    return this.stores().reduce(
      (total, store) => total + store?.ecommerces?.length,
      0
    );
  });

  ngOnInit() {
    this.loadStores();
    this.loadEcommerces();
  }

  loadStores() {
    this.isLoading.set(true);
    this.storesService.getStores().subscribe({
      next: (data) => {
        const stores = data.map((store) => (this.mapToFrontendModel(store)));
        this.stores.set(stores);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        this.toastService.error('Erro ao carregar lojas. Tente novamente.');
        this.isLoading.set(false);
      }
    });
  }

  loadEcommerces() {
    this.ecommercesService.getEcommerces().subscribe({
      next: (data) => {
        this.ecommerces.set(data.filter((e) => e.status === Status.ACTIVE));
      },
      error: (err) => {
        console.error('Error loading ecommerces:', err);
        // Silent fail or warning? Users can't create stores if ecommerces fail to load.
        this.toastService.warning('Não foi possível carregar a lista de e-commerces.');
      }
    });
  }

  openNewStoreModal() {
    this.editingStore.set(null);
    this.showStoreModal.set(true);
    this.uploadProgress.set(0);
  }

  editStore(store: Store) {
    this.editingStore.set(store);
    this.showStoreModal.set(true);
    this.uploadProgress.set(0);
  }

  closeModal() {
    if (this.isSaving()) return;
    this.showStoreModal.set(false);
    this.editingStore.set(null);
    this.uploadProgress.set(0);
  }

  handleSaveStore(formData: StoreFormData) {
    this.isSaving.set(true);
    this.uploadProgress.set(0);

    const isEdit = !!this.editingStore();
    const operation = isEdit 
      ? this.storesService.updateStore(this.editingStore()!.id, {
          name: formData.name,
          description: formData.description,
          ecommerceIds: formData.ecommerceIds // Using platforms as ecommerceIds based on DTO
        })
      : this.storesService.createStore({
          name: formData.name,
          description: formData.description,
          ecommerceIds: formData.ecommerceIds
        });

    operation.subscribe({
      next: (store) => {
        if (formData.imageFile) {
          this.handleUpload(store.id, formData.imageFile, isEdit);
        } else {
          this.finishSave(isEdit ? 'atualizada' : 'criada');
        }
      },
      error: (err) => {
        console.error('Error saving store:', err);
        this.isSaving.set(false);
        this.toastService.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} loja. Verifique os dados.`);
      }
    });
  }

  private handleUpload(id: string, file: File, isEdit: boolean) {
    this.storesService.uploadImage(id, file)
      .pipe(
        timeout(30000),
        retry(3)
      )
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round(100 * event.loaded / event.total);
            this.uploadProgress.set(progress);
          } else if (event.type === HttpEventType.Response) {
            this.finishSave(isEdit ? 'atualizada' : 'criada', true);
          }
        },
        error: (err) => {
          console.error('Error uploading image:', err);
          
          if (!isEdit) {
            // Rollback creation
            this.storesService.deleteStore(id).subscribe({
              next: () => console.log('Rollback successful'),
              error: (e) => console.error('Rollback failed', e)
            });
            this.toastService.error('Erro ao enviar imagem. A loja foi removida. Tente novamente.');
          } else {
            this.toastService.error('Loja atualizada, mas erro ao enviar imagem.');
            this.loadStores();
          }

          this.isSaving.set(false);
          this.uploadProgress.set(0);
        }
      });
  }

  private finishSave(action: string, withImage = false) {
    this.loadStores();
    this.isSaving.set(false);
    this.closeModal();
    this.toastService.success(`Loja ${action} com sucesso!${withImage ? ' Imagem enviada.' : ''}`);
  }

  deleteStore(id: string) {
    const store = this.stores().find(s => s.id === id);

    this.confirmDialog.open({
      title: 'Excluir loja',
      message: store
        ? `Tem certeza que deseja excluir a loja "${store.name}"?`
        : 'Tem certeza que deseja excluir esta loja?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.storesService.deleteStore(id).subscribe({
        next: () => {
          this.stores.update(stores => stores.filter(s => s.id !== id));
          this.toastService.success('Loja excluída com sucesso.');
        },
        error: (err) => {
          console.error('Error deleting store:', err);
          this.toastService.error('Erro ao excluir loja.');
        }
      });
    });
  }

  getProductCount(storeId: string): number {
    return this.productCounts()[storeId] || 0;
  }

    private mapToFrontendModel(backend: Store): Store {
      let imageUrl = undefined;
      if (backend.imageUrl && backend.imageUrl.startsWith('uploads/')) {
         // Ensure no double slashes when joining
        const baseUrl = environment.uploadsUrl.endsWith('/') ? environment.uploadsUrl.slice(0, -1) : environment.uploadsUrl;
        imageUrl = `${baseUrl}/${backend.imageUrl}`;
      }
  
      return {
        ...backend,
        imageUrl: imageUrl
      };
    }
}
