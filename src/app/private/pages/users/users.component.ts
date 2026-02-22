import { Component, OnInit, Signal, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService, Pagination, User } from '../../../core/services/users.service';
import { finalize } from 'rxjs';
import { LucideAngularModule, PlusIcon, PencilIcon, Trash2Icon, RotateCcwIcon } from 'lucide-angular';
import { UserModalComponent } from './components/user-modal/user-modal.component';
import { ToastService } from '../../../shared/services/toast.service';
import { Role } from '../../../core/types/user.types';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UserModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private toastService = inject(ToastService);

  Role = Role;
  allUsers = signal<User[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  showModal = signal(false);
  selectedUser = signal<User | null>(null);

  pagination: WritableSignal<Pagination> = signal({
    page: 1,
    totalPages: 0,
    total: 0,
    limit: 10
  });

  // Icons
  readonly PlusIcon = PlusIcon;
  readonly PencilIcon = PencilIcon;
  readonly Trash2Icon = Trash2Icon;
  readonly RotateCcwIcon = RotateCcwIcon;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page: number = 1): void {
    this.isLoading.set(true);
    this.usersService.getUsers(page, this.pagination().limit)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.allUsers.set(response.data);
          this.pagination.set({
            page: response.page,
            totalPages: Math.ceil(response.total / response.limit),
            total: response.total,
            limit: response.limit
          });
        },
        error: (error) => {
          console.error('Erro ao carregar usuários:', error);
          this.toastService.error((error.error?.message as string) || 'Erro ao carregar lista de usuários');
        }
      });
  }

  openCreateModal(): void {
    this.selectedUser.set(null);
    this.showModal.set(true);
  }

  openEditModal(user: User): void {
    this.selectedUser.set(user);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedUser.set(null);
  }

  handleSave(userData: Partial<User>): void {
    this.isSaving.set(true);
    const operation = this.selectedUser() 
      ? this.usersService.updateUser(this.selectedUser()!.id, userData)
      : this.usersService.createUser(userData);

    operation.pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.toastService.success(this.selectedUser() ? 'Usuário atualizado!' : 'Usuário criado!');
          this.closeModal();
          this.loadUsers(this.pagination().page);
        },
        error: (error) => {
          console.error('Erro ao salvar usuário:', error);
          this.toastService.error((error.error?.message as string) || 'Erro ao salvar usuário');
        }
      });
  }

  confirmDelete(user: User): void {
    if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
      this.usersService.deleteUser(user.id).subscribe({
        next: () => {
          this.toastService.success('Usuário excluído!');
          this.loadUsers(this.pagination().page);
        },
        error: (error) => {
          console.error('Erro ao excluir usuário:', error);
          this.toastService.error((error.error?.message as string) || 'Erro ao excluir usuário');
        }
      });
    }
  }

  confirmRestore(user: User): void {
    if (confirm(`Deseja reativar o usuário ${user.name}?`)) {
      this.usersService.restoreUser(user.id).subscribe({
        next: () => {
          this.toastService.success('Usuário reativado com sucesso!');
          this.loadUsers(this.pagination().page);
        },
        error: (error) => {
          console.error('Erro ao reativar usuário:', error);
          this.toastService.error((error.error?.message as string) || 'Erro ao reativar usuário');
        }
      });
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination().totalPages) {
      this.loadUsers(page);
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }
}
