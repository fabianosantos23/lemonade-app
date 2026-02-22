import { ChangeDetectionStrategy, Component, computed, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, XIcon, PackageIcon, InfoIcon, Loader2Icon, CheckIcon, CopyIcon, SparklesIcon, SaveIcon } from 'lucide-angular';
import { Product, GeneratedDescription, ImprovedDescriptionStatus } from '../../../../../core/types/product.types';
import { MultiselectComponent, MultiselectOption } from '../../../../../shared/components/multiselect/multiselect.component';
import { ProductsService } from '../../../../../services/products.service';
import { Ecommerce } from '../../../../../services/ecommerces.service';

export interface ProcessingStep {
  id: string;
  name: string;
  icon: string;
  status: 'inactive' | 'pending' | 'processing' | 'done' | 'error';
  description: string;
  progress: number;
}

@Component({
  selector: 'app-enhance-with-ai-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MultiselectComponent],
  templateUrl: './enhance-with-ai-modal.component.html',
  styleUrl: './enhance-with-ai-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnhanceWithAIModalComponent {
  private productsService = inject(ProductsService);

  // Inputs
  isOpen = input<boolean>(false);
  product = input<Product | null>(null);
  ecommerces = input<Ecommerce[]>([]);

  // Outputs
  close = output<void>();
  submit = output<{
    productId: string;
    ecommerces: (string | number)[];
    generatedDescriptions: GeneratedDescription[];
  }>();

  // Icons
  readonly XIcon = XIcon;
  readonly PackageIcon = PackageIcon;
  readonly InfoIcon = InfoIcon;
  readonly Loader2Icon = Loader2Icon;
  readonly CheckIcon = CheckIcon;
  readonly CopyIcon = CopyIcon;
  readonly SparklesIcon = SparklesIcon;
  readonly SaveIcon = SaveIcon;

  // State
  selectedEcommerces = signal<(string | number)[]>([]);
  isProcessing = signal(false);
  isCompleted = signal(false);
  processingSteps = signal<ProcessingStep[]>([]);
  copiedIds = signal<string[]>([]);

  // Computed
  ecommerceOptions = computed<MultiselectOption[]>(() => {
    return this.ecommerces().map((e) => ({ id: e.id, label: e.name }));
  });

  estimatedTime = computed(() => {
    const minutes = this.selectedEcommerces().length * 2;
    return `${minutes}-${minutes + 2} minutos`;
  });

  overallProgress = computed(() => {
    const steps = this.processingSteps();
    if (steps.length === 0) return 0;
    const totalProgress = steps.reduce((sum, step) => sum + step.progress, 0);
    return Math.round(totalProgress / steps.length);
  });

  constructor() {
      if (!this.isOpen()) {
        this.resetModal();
      }
  }

  handleClose() {
    if (!this.isProcessing()) {
      this.close.emit();
    }
  }

  resetModal() {
    this.selectedEcommerces.set([]);
    this.isProcessing.set(false);
    this.isCompleted.set(false);
    this.processingSteps.set([]);
    this.copiedIds.set([]);
  }

  startProcessing() {
    const p = this.product();
    if (!p) return;

    this.isProcessing.set(true);
    const selectedIds = this.selectedEcommerces().map(id => id.toString());
    
    const initialSteps: ProcessingStep[] = selectedIds.map(id => {
      const option = this.ecommerceOptions().find(opt => opt.id === id);
      return {
        id: id,
        name: option?.label || id,
        icon: '🛍️',
        status: 'pending',
        description: '',
        progress: 0
      };
    });
    this.processingSteps.set(initialSteps);

    // Call API for batch generation
    this.productsService.generateBatch(p.id, { 
      ecommerceIds: selectedIds,
      simpleDescription: p.simpleDescription
    }).subscribe({
      next: (response) => {
        const results = response.data || response;
        const updatedSteps = initialSteps.map(step => {
          const result = results.find((r) => r?.ecommerceId === step.id);
          return {
            ...step,
            status: 'done' as const,
            progress: 100,
            description: result?.result || 'Descrição gerada com sucesso.'
          };
        });
        this.processingSteps.set(updatedSteps);
        this.isCompleted.set(true);
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error('Error generating descriptions:', err);
        const errorSteps = initialSteps.map(step => ({
          ...step,
          status: 'error' as const,
          progress: 100,
          description: 'Erro ao gerar descrição para este canal.'
        }));
        this.processingSteps.set(errorSteps);
        this.isProcessing.set(false);
      }
    });
  }

  

  async copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedIds.update(ids => [...ids, id]);
      setTimeout(() => {
        this.copiedIds.update(ids => ids.filter(i => i !== id));
      }, 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  }

  handleSaveDescriptions() {
    const p = this.product();
    if (!p) return;

    const generated: GeneratedDescription[] = this.processingSteps().map(step => ({
      id: step.id,
      name: step.name,
      icon: step.icon,
      result: step.description,
      generatedAt: new Date().toISOString(),
      status: ImprovedDescriptionStatus.GENERATED
    }));

    this.submit.emit({
      productId: p.id,
      ecommerces: this.selectedEcommerces(),
      generatedDescriptions: generated
    });

    this.handleClose();
  }
}
