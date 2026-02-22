import { Component, OnInit, computed, effect, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, XIcon, UploadIcon, AlertCircleIcon, ImagePlusIcon } from 'lucide-angular';
import { Store } from '../../../../../core/types/store.types';
import { MultiselectComponent } from '../../../../../shared/components/multiselect/multiselect.component';
import { ImageUploadComponent } from '../../../../../shared/components/image-upload/image-upload.component';
import { Ecommerce } from '../../../../../services/ecommerces.service';

export interface StoreFormData {
  name: string;
  description: string;
  imageUrl?: string;
  ecommerceIds: string[];
  imageFile?: File;
}

@Component({
  selector: 'app-store-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, MultiselectComponent, ImageUploadComponent],
  templateUrl: './store-modal.component.html',
  styleUrl: './store-modal.component.scss'
})
export class StoreModalComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Inputs
  store = input<Store | null>(null);
  isSaving = input<boolean>(false);
  uploadProgress = input<number>(0);
  ecommerces = input<Ecommerce[]>([]);

  // Outputs
  save = output<StoreFormData>();
  cancel = output<void>();

  // State
  imageFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  // Form
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    ecommerces: [[], [Validators.required]]
  });

  // Computed
  ecommerceOptions = computed(() => {
    return this.ecommerces().map(e => ({ 
      id: e.id, 
      label: e.name,
      // You can add icon or other properties if MultiselectComponent supports them
    }));
  });

  // Icons
  readonly XIcon = XIcon;
  readonly UploadIcon = UploadIcon;
  readonly AlertCircleIcon = AlertCircleIcon;
  readonly ImagePlusIcon = ImagePlusIcon;

  isEditing = computed(() => !!this.store());

  constructor() {
    // Reset form when store input changes
    effect(() => {
      const currentStore = this.store();
      if (currentStore) {
        this.form.reset({
          name: currentStore.name,
          description: currentStore.description || "",
          ecommerces: [...currentStore.ecommerceIds],
        });
        
        if (currentStore.imageUrl) {  
          this.imagePreview.set(currentStore.imageUrl);
        } else {
          this.imagePreview.set(null);
          this.imageFile.set(null);
        }
      } else {
        this.form.reset({
          name: "",
          description: "",
          ecommerces: [],
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

    const rawValue = this.form.getRawValue();
    const formData: StoreFormData = {
      name: rawValue.name,
      description: rawValue.description,
      ecommerceIds: rawValue.ecommerces || [],
    };

    if (this.imageFile()) {
      formData.imageFile = this.imageFile()!;
    }
    
    formData.imageUrl = this.imagePreview() || '';

    this.save.emit(formData);
  }
}
