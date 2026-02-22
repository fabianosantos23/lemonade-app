import { Directive, ElementRef, Output, EventEmitter, inject, OnDestroy, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Directive({
  selector: '[clickOutside]',
  standalone: true
})
export class ClickOutsideDirective implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private document = inject(DOCUMENT);
  
  @Output() clickOutside = new EventEmitter<void>();

  private listener: ((event: MouseEvent) => void) | null = null;

  ngAfterViewInit() {
    this.listener = (event: MouseEvent) => this.onClick(event);
    // Use capture phase (true) to detect clicks even if stopPropagation is used on child elements
    this.document.addEventListener('click', this.listener, true);
  }

  ngOnDestroy() {
    if (this.listener) {
      this.document.removeEventListener('click', this.listener, true);
    }
  }

  private onClick(event: MouseEvent) {
    const target = event.target as Node;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const clickedInside = this.elementRef.nativeElement.contains(target);
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
