import { Component, OnInit, computed, effect, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, XIcon, AlertCircleIcon } from 'lucide-angular';
import { Ecommerce } from '../../../../../services/ecommerces.service';
import { ImageUploadComponent } from '../../../../../shared/components/image-upload/image-upload.component';

export interface EcommerceFormData {
  name: string;
  prompt: string;
  image?: string;
  imageFile?: File;
}

@Component({
  selector: 'app-ecommerce-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, ImageUploadComponent],
  templateUrl: './ecommerce-modal.component.html',
  styleUrl: './ecommerce-modal.component.scss'
})
export class EcommerceModalComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Inputs
  ecommerce = input<Ecommerce | null>(null);
  isSaving = input<boolean>(false);
  errorMessage = input<string | null>(null);
  uploadProgress = input<number>(0); // Progress input from parent

  // Outputs
  save = output<EcommerceFormData>();
  cancel = output<void>();

  // State
  imageFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  // Form
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    prompt: ['', [Validators.required]],
  });

  // Icons
  readonly XIcon = XIcon;
  readonly AlertCircleIcon = AlertCircleIcon;

  // Computed
  isEditing = computed(() => !!this.ecommerce());

  constructor() {
    // Reset form when ecommerce input changes
    effect(() => {
      const currentEcommerce = this.ecommerce();
      if (currentEcommerce) {
        this.form.reset({
          name: currentEcommerce.name,
          prompt: currentEcommerce.description || "", // Mapping description to prompt
        });
        
        // Load existing image if available
        if (currentEcommerce.imageUrl) {
            this.imagePreview.set(currentEcommerce.imageUrl);
        } else {
            this.imagePreview.set(null);
            this.imageFile.set(null);
        }
      } else {
        this.form.reset({
          name: "",
          prompt: "",
        });
        this.imagePreview.set(null);
        this.imageFile.set(null);
      }
    });
  }

  ngOnInit() {
    // Effect handles initialization
  }

  onFilesChange(files: File[]) {
    if (files.length > 0) {
      this.imageFile.set(files[0]);
    } else {
      this.imageFile.set(null);
    }
  }

  closeModal() {
    if (this.isSaving()) return;
    this.imageFile.set(null);
    this.imagePreview.set(null);
    this.cancel.emit();
  }

  onSubmit() {
    if (this.isSaving()) return;
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = this.form.getRawValue() as EcommerceFormData;
    if (this.imageFile()) {
      formData.imageFile = this.imageFile()!;
    }
    
    this.save.emit(formData);
  }
}
