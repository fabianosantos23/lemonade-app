import { Component, computed, effect, input, output, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { LucideAngularModule, XIcon, AlertCircleIcon, SearchIcon, CheckIcon, Loader2Icon, Building2Icon } from 'lucide-angular';
import { Product } from '../../../../../core/types/product.types';
import { StoresService } from '../../../../../services/stores.service';
import { Store } from '../../../../../core/types/store.types';
import { debounceTime, distinctUntilChanged, switchMap, tap, finalize, of, Subscription, catchError } from 'rxjs';
import { ImageUploadComponent } from '../../../../../shared/components/image-upload/image-upload.component';

export interface ProductFormData {
  name: string;
  description: string;
  storeId: string;
  image?: File;
}

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, ImageUploadComponent],
  templateUrl: './product-modal.component.html',
  styleUrl: './product-modal.component.scss'
})
export class ProductModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private storesService = inject(StoresService);

  // Inputs
  product = input<Product | null>(null);
  isSaving = input<boolean>(false);

  // Outputs
  save = output<ProductFormData>();
  cancel = output<void>();

  // Icons
  readonly XIcon = XIcon;
  readonly AlertCircleIcon = AlertCircleIcon;
  readonly SearchIcon = SearchIcon;
  readonly CheckIcon = CheckIcon;
  readonly Loader2Icon = Loader2Icon;
  readonly Building2Icon = Building2Icon;

  // State
  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  
  suggestedStores = signal<Store[]>([]);
  isLoadingStores = signal(false);
  showSuggestions = signal(false);
  selectedStore = signal<Store | null>(null);
  searchError = signal<string | null>(null);

  private searchSubscription?: Subscription;

  // Form
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    storeId: ['', [Validators.required]],
    storeSearch: ['']
  });

  // Computed
  isEditing = computed(() => !!this.product());

  constructor() {
    // Reset form and image when product input changes
    effect(() => {
      const currentProduct = this.product();
      if (currentProduct) {
        this.form.patchValue({
          name: currentProduct.name,
          description: currentProduct.simpleDescription || "",
          storeId: currentProduct.storeId,
          storeSearch: ""
        });
        
        // If editing, we might need to load the store name
        if (currentProduct.storeId) {
          this.storesService.getStore(currentProduct.storeId).subscribe(store => {
            this.selectedStore.set(store);
            this.form.patchValue({ storeSearch: store.name }, { emitEvent: false });
          });
        }

        this.imagePreview.set(currentProduct.imageUrl ? currentProduct.imageUrl : null);
        this.selectedFile.set(null);
      } else {
        this.form.reset({
          name: "",
          description: "",
          storeId: "",
          storeSearch: ""
        });
        this.imagePreview.set(null);
        this.selectedFile.set(null);
        this.selectedStore.set(null);
      }
    });
  }

  ngOnInit() {
    this.setupStoreSearch();
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  private setupStoreSearch() {
    this.searchSubscription = this.form.get('storeSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap((value) => {
        if (!value || value.length < 2) {
          this.suggestedStores.set([]);
          this.showSuggestions.set(false);
          if (!this.selectedStore()) {
            this.form.get('storeId')?.setValue('');
          }
          return;
        }
        this.isLoadingStores.set(true);
        this.searchError.set(null);
      }),
      switchMap((value) => {
        if (!value || value.length < 2) return of([]);
        return this.storesService.getStores({ search: value, page: 1, limit: 5, status: 'ACTIVE' }).pipe(
          finalize(() => this.isLoadingStores.set(false)),
          catchError(() => {
            this.searchError.set('Erro ao buscar lojas. Tente novamente.');
            return of([]);
          })
        );
      })
    ).subscribe((stores) => {
      if (stores) {
        this.suggestedStores.set(stores);
        this.showSuggestions.set(stores.length > 0);
      }
    });
  }

  selectStore(store: Store) {
    this.selectedStore.set(store);
    this.form.patchValue({
      storeId: store.id,
      storeSearch: store.name
    }, { emitEvent: false });
    this.showSuggestions.set(false);
    this.suggestedStores.set([]);
  }

  onSearchBlur() {
    // Small delay to allow click on suggestion
    setTimeout(() => {
      this.showSuggestions.set(false);
      // If no store selected and search is not empty, clear or validate
      if (!this.selectedStore() || this.form.get('storeSearch')?.value !== this.selectedStore()?.name) {
        this.selectedStore.set(null);
        this.form.get('storeId')?.setValue('');
      }
    }, 200);
  }

  onSearchFocus() {
    this.showSuggestions.set(true);
    if (this.form.get('storeSearch')?.value?.length >= 2 && this.suggestedStores().length === 0) {
      this.setupStoreSearch();
    }
  }

  clearSelection() {
    this.selectedStore.set(null);
    this.form.patchValue({
      storeId: '',
      storeSearch: ''
    });
    this.suggestedStores.set([]);
    this.showSuggestions.set(false);
  }

  onFilesChange(files: File[]) {
    if (files.length > 0) {
      this.selectedFile.set(files[0]);
    } else {
      this.selectedFile.set(null);
    }
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

    const rawValue = this.form.getRawValue();
    const formData: ProductFormData = {
      name: rawValue.name,
      description: rawValue.description,
      storeId: rawValue.storeId,
      image: this.selectedFile() || undefined,
    };

    this.save.emit(formData);
  }
}
