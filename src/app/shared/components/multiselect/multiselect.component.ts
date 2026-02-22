import { Component, computed, input, signal, ElementRef, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { ClickOutsideDirective } from '../../../core/directives/click-outside.directive';

export interface MultiselectOption {
  id: string | number;
  label: string;
  icon?: string;
  description?: string;
}

@Component({
  selector: 'app-multiselect',
  standalone: true,
  imports: [CommonModule, FormsModule, ClickOutsideDirective],
  templateUrl: './multiselect.component.html',
  styleUrl: './multiselect.component.scss'
})
export class MultiselectComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>('');
  placeholder = input<string>('Selecione as opções...');
  helperText = input<string>('');
  required = input<boolean>(false);
  options = input<MultiselectOption[]>([]);

  // State
  isOpen = signal(false);
  searchQuery = signal('');
  value = signal<(string | number)[]>([]);
  isDisabled = signal(false);

  // Template Refs
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInputRef');

  // Computed
  selectedItems = computed(() => {
    const currentOptions = this.options();
    const currentValue = this.value();
    return currentOptions.filter((opt) => currentValue.includes(opt.id));
  });

  filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const currentOptions = this.options();
    
    if (!query) return currentOptions;

    return currentOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query)
    );
  });

  // Inject NgControl for validation state
  ngControl = inject(NgControl, { optional: true, self: true });

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  // ControlValueAccessor callbacks
  onChange: (value: (string | number)[]) => void = () => {};
  onTouched: () => void = () => {};

  // Methods
  isSelected(option: MultiselectOption): boolean {
    return this.value().includes(option.id);
  }

  toggleOption(option: MultiselectOption) {
    if (this.isDisabled()) return;

    const currentValue = this.value();
    const newValue = this.isSelected(option)
      ? currentValue.filter((id) => id !== option.id)
      : [...currentValue, option.id];

    this.value.set(newValue);
    this.onChange(newValue);
    this.onTouched();
  }

  removeItem(item: MultiselectOption, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    if (this.isDisabled()) return;

    const newValue = this.value().filter((id) => id !== item.id);
    this.value.set(newValue);
    this.onChange(newValue);
    this.onTouched();
  }

  openDropdown() {
    if (this.isDisabled() || this.isOpen()) return;
    this.isOpen.set(true);
  }

  closeDropdown() {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.onTouched();
  }

  toggleDropdown(event?: Event) {
    if (this.isDisabled()) return;
    
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
      // Focus search input after opening
      setTimeout(() => {
        this.searchInput()?.nativeElement.focus();
      });
    }
  }

  selectFirst() {
    const options = this.filteredOptions();
    if (options.length > 0) {
      this.toggleOption(options[0]);
    }
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  // CVA Implementation
  writeValue(obj: (string | number)[]): void {
    if (Array.isArray(obj)) {
      this.value.set(obj);
    } else {
      this.value.set([]);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
