import { Component, computed, effect, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, XIcon, AlertCircleIcon } from 'lucide-angular';
import { User } from '../../../../../core/services/users.service';
import { Role } from '../../../../../core/types/user.types';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './user-modal.component.html',
  styles: '',
})
export class UserModalComponent {
  // Inputs
  user = input<User | null>(null);
  isSaving = input<boolean>(false);

  // Outputs
  save = output<Partial<User>>();
  cancel = output<void>();

  // Icons
  readonly XIcon = XIcon;
  readonly AlertCircleIcon = AlertCircleIcon;

  // Roles for select
  roles = Object.values(Role);

  isEditing = computed(() => !!this.user());

  form = new FormGroup({
    name: new FormControl('', {
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      nonNullable: true
    }),
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(8)],
      nonNullable: true
    }),
    role: new FormControl<Role>(Role.MEMBER, {
      validators: [Validators.required],
      nonNullable: true
    })
  });

  constructor() {
    effect(() => {
      const currentUser = this.user();
      if (currentUser) {
        this.form.patchValue({
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          password: '********'
        });
        this.form.controls.password.disable();
        this.form.controls.email.disable();
      } else {
        this.form.reset({
          role: Role.MEMBER
        });
        this.form.controls.password.enable();
        this.form.controls.email.enable();
      }
    });
  }

  closeModal() {
    if (this.isSaving()) return;
    this.cancel.emit();
  }

  onSubmit() {
    if (this.isSaving()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, ...rest } = this.form.getRawValue();
    
    // For edit, we don't send email or password if they were disabled/unchanged
    const payload = this.isEditing() ? rest : { email, password, ...rest }

    this.save.emit(payload);
  }
}
