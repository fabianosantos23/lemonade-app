import { Component, input, output, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, UploadIcon, Trash2Icon, AlertCircleIcon, XIcon } from 'lucide-angular';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './image-upload.component.html',
})
export class ImageUploadComponent {
  // Configuration Inputs
  label = input<string>('');
  subLabel = input<string>('');
  optional = input<boolean>(false);
  multiple = input<boolean>(false);
  maxSize = input<number>(5 * 1024 * 1024); // Default 5MB
  accept = input<string>('image/jpeg,image/png,image/gif,image/webp');
  
  // State Inputs
  uploadProgress = input<number>(0);
  isSaving = input<boolean>(false);
  
  // Initial State (for existing images)
  initialPreview = input<string | null>(null);

  // Outputs
  filesChange = output<File[]>();
  
  // Internal State
  files = signal<File[]>([]);
  previews = signal<string[]>([]); // Array of preview URLs
  error = signal<string | null>(null);
  isDragOver = signal<boolean>(false);

  // Icons
  readonly UploadIcon = UploadIcon;
  readonly Trash2Icon = Trash2Icon;
  readonly AlertCircleIcon = AlertCircleIcon;
  readonly XIcon = XIcon;

  constructor() {
    // Initialize preview if provided
    effect(() => {
      const initial = this.initialPreview();
      
      untracked(() => {
        if (initial && this.files().length === 0 && this.previews().length === 0) {
          this.previews.set([initial]);
        }
      });
    }, { allowSignalWrites: true });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.processFiles(Array.from(input.files));
    input.value = ''; // Reset input
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isSaving()) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    if (this.isSaving()) return;

    if (event.dataTransfer?.files?.length) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  private processFiles(newFiles: File[]) {
    this.error.set(null);
    const validFiles: File[] = [];
    const validTypes = this.accept().split(',').map(t => t.trim());

    for (const file of newFiles) {
      // Validate Type
      if (!validTypes.includes(file.type)) {
        this.error.set('Formato inválido. Use JPG, PNG, GIF ou WEBP.');
        return;
      }

      // Validate Size
      if (file.size > this.maxSize()) {
        const sizeMB = Math.floor(this.maxSize() / (1024 * 1024));
        this.error.set(`Arquivo muito grande. Máximo de ${sizeMB}MB.`);
        return;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    if (this.multiple()) {
      // Append to existing
      this.files.update(current => [...current, ...validFiles]);
      this.generatePreviews(validFiles, true);
    } else {
      // Replace existing
      this.files.set([validFiles[0]]);
      this.generatePreviews([validFiles[0]], false);
    }

    this.filesChange.emit(this.files());
  }

  private generatePreviews(files: File[], append: boolean) {
    if (!append) {
        this.previews.set([]);
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const result = e.target.result as string;
          this.previews.update(current => [...current, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeFile(index: number, event?: Event) {
    event?.stopPropagation();
    
    if (this.files().length > 0) {
        if (this.files().length === 0) {
            this.previews.update(current => current.filter((_, i) => i !== index));
            this.filesChange.emit([]);
        } else {
            this.files.update(current => current.filter((_, i) => i !== index));
            this.previews.update(current => current.filter((_, i) => i !== index));
            this.filesChange.emit(this.files());
        }
    } else {
        // No files, just previews (initial)
        this.previews.update(current => current.filter((_, i) => i !== index));
        this.filesChange.emit([]);
    }
    
    this.error.set(null);
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    if (this.isSaving()) return;
    fileInput.click();
  }
}
