import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { timeout, retry } from 'rxjs';
import { LucideAngularModule, PlusIcon, PencilIcon, Loader2Icon, XCircleIcon, CheckCircleIcon } from 'lucide-angular';
import { Ecommerce, EcommercesService } from '../../../services/ecommerces.service';
import { EcommerceModalComponent, EcommerceFormData } from './components/ecommerce-modal/ecommerce-modal.component';
import { ToastService } from '../../../shared/services/toast.service';
import { Status } from '../../../core/types/common.types';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-ecommerces',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, EcommerceModalComponent],
  templateUrl: './ecommerces.component.html',
  styleUrl: './ecommerces.component.scss'
})
export class EcommercesComponent implements OnInit {
  private ecommercesService = inject(EcommercesService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  
  ecommerces = signal<Ecommerce[]>([]);
  showModal = signal(false);
  editingEcommerce = signal<Ecommerce | null>(null);
  
  // Loading states
  isLoadingList = signal(false);
  isSaving = signal(false);
  uploadProgress = signal(0);
  isTogglingStatus = signal<string | null>(null); // Stores ID of ecommerce being toggled

  // Icons
  readonly PlusIcon = PlusIcon;
  readonly PencilIcon = PencilIcon;
  readonly Loader2Icon = Loader2Icon;
  readonly XCircleIcon = XCircleIcon;
  readonly CheckCircleIcon = CheckCircleIcon;

  ngOnInit() {
    this.loadEcommerces();
  }

  loadEcommerces() {
    this.isLoadingList.set(true);
    
    this.ecommercesService.getEcommerces().subscribe({
      next: (data) => {
        this.ecommerces.set(data);
        this.isLoadingList.set(false);
      },
      error: (err) => {
        console.error('Error loading ecommerces:', err);
        this.toastService.error('Erro ao carregar e-commerces. Tente novamente.');
        this.isLoadingList.set(false);
      }
    });
  }

  toggleEcommerceConnection(ecommerce: Ecommerce) {
    const activating = ecommerce.status !== Status.ACTIVE;

    this.confirmDialog.open({
      title: activating ? 'Ativar marketplace' : 'Desativar marketplace',
      message: activating
        ? `Deseja ativar o marketplace "${ecommerce.name}"?`
        : `Deseja desativar o marketplace "${ecommerce.name}"?`,
      confirmText: activating ? 'Ativar' : 'Desativar',
      cancelText: 'Cancelar'
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.isTogglingStatus.set(ecommerce.id);
      const newStatus = ecommerce.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE;

      this.ecommercesService.updateStatus(ecommerce.id, newStatus)
        .subscribe({
          next: () => {
            this.loadEcommerces();
            this.toastService.success(`Marketplace ${newStatus === Status.ACTIVE ? 'ativado' : 'desativado'} com sucesso.`);
            this.isTogglingStatus.set(null);
          },
          error: (err) => {
            console.error('Error toggling status:', err);
            this.toastService.error('Erro ao alterar status do marketplace.');
            this.isTogglingStatus.set(null);
          }
        });
    });
  }

  openCreateModal() {
    this.editingEcommerce.set(null);
    this.showModal.set(true);
    this.uploadProgress.set(0);
  }

  openEditModal(ecommerce: Ecommerce) {
    this.editingEcommerce.set(ecommerce);
    this.showModal.set(true);
    this.uploadProgress.set(0);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingEcommerce.set(null);
    this.uploadProgress.set(0);
  }

  handleSave(data: EcommerceFormData) {
    this.isSaving.set(true);
    this.uploadProgress.set(0);

    const isEdit = !!this.editingEcommerce();
    const operation = isEdit 
      ? this.ecommercesService.updateEcommerce(this.editingEcommerce()!.id, {
          name: data.name,
          prompt: data.prompt,
          image: data.image
        })
      : this.ecommercesService.createEcommerce({
          name: data.name,
          prompt: data.prompt,
          image: data.image,
          status: 'ACTIVE'
        });

    operation.subscribe({
      next: (ecommerce) => {
        if (data.imageFile) {
          this.handleUpload(ecommerce.id, data.imageFile, isEdit);
        } else {
          this.finishSave(isEdit ? 'atualizado' : 'criado');
        }
      },
      error: (err) => {
        console.error('Error saving ecommerce:', err);
        this.isSaving.set(false);
        this.toastService.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} e-commerce. Verifique os dados.`);
      }
    });
  }

  private handleUpload(id: string, file: File, isEdit: boolean) {
    this.ecommercesService.uploadImage(id, file)
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
            this.finishSave(isEdit ? 'atualizado' : 'criado', true);
          }
        },
        error: (err) => {
          console.error('Error uploading image:', err);
          
          if (!isEdit) {
            // Rollback creation
            this.ecommercesService.deleteEcommerce(id).subscribe({
              next: () => console.log('Rollback successful'),
              error: (e) => console.error('Rollback failed', e)
            });
            this.toastService.error('Erro ao enviar imagem. O e-commerce foi removido. Tente novamente.');
          } else {
            this.toastService.error('Marketplace atualizado, mas erro ao enviar imagem.');
            // Even if upload failed, the ecommerce text data was updated, so we reload
            this.loadEcommerces();
          }

          this.isSaving.set(false);
          this.uploadProgress.set(0);
        }
      });
  }

  private finishSave(action: string, withImage = false) {
    this.loadEcommerces();
    this.isSaving.set(false);
    this.closeModal();
    this.toastService.success(`Marketplace ${action} com sucesso!${withImage ? ' Imagem enviada.' : ''}`);
  }
}
