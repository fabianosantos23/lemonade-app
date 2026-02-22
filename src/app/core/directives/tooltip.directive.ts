import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  inject,
} from '@angular/core';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';
type TooltipTrigger = 'hover' | 'click' | 'focus';

interface TooltipConfig {
  placement: TooltipPlacement;
  triggers: TooltipTrigger[];
  delayShow: number;
  delayHide: number;
  maxWidth: number;
}

const DEFAULT_CONFIG: TooltipConfig = {
  placement: 'auto',
  triggers: ['hover', 'focus'],
  delayShow: 200,
  delayHide: 150,
  maxWidth: 260,
};

@Directive({
  selector: '[appTooltip]',
  standalone: true,
  host: {
    '[attr.aria-describedby]': 'tooltipId',
    '[attr.tabindex]': 'tabIndex',
  },
})
export class TooltipDirective {
  private elementRef = inject(ElementRef<HTMLElement>);

  @Input('appTooltip') content: string | null = null;
  @Input() tooltipPlacement: TooltipPlacement = 'auto';
  @Input() tooltipTrigger: TooltipTrigger | TooltipTrigger[] = ['hover', 'focus'];
  @Input() tooltipDelayShow = DEFAULT_CONFIG.delayShow;
  @Input() tooltipDelayHide = DEFAULT_CONFIG.delayHide;
  @Input() tooltipMaxWidth = DEFAULT_CONFIG.maxWidth;

  tooltipId = '';
  tabIndex: number | null = null;

  private tooltipEl: HTMLDivElement | null = null;
  private showTimer: number | null = null;
  private hideTimer: number | null = null;
  private isVisible = false;

  private static activeTooltip: TooltipDirective | null = null;
  private static globalClickListenerInitialized = false;

  constructor() {
    const el = this.elementRef.nativeElement;
    this.tooltipId = `tooltip-${Math.random().toString(36).slice(2)}`;

    const isNaturallyFocusable =
      ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
    this.tabIndex = isNaturallyFocusable ? null : 0;

    if (!this.content) {
      const title = el.getAttribute('title');
      if (title) {
        this.content = title;
        el.removeAttribute('title');
      }
    }

    TooltipDirective.ensureGlobalClickListener();
  }

  @HostListener('mouseenter')
  handleMouseEnter(): void {
    if (!this.hasTrigger('hover')) return;
    this.scheduleShow();
  }

  @HostListener('mouseleave')
  handleMouseLeave(): void {
    if (!this.hasTrigger('hover')) return;
    this.scheduleHide();
  }

  @HostListener('focus')
  handleFocus(): void {
    if (!this.hasTrigger('focus')) return;
    this.scheduleShow();
  }

  @HostListener('blur')
  handleBlur(): void {
    if (!this.hasTrigger('focus')) return;
    this.scheduleHide();
  }

  @HostListener('click')
  handleClick(): void {
    if (!this.hasTrigger('click')) return;
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.hide();
  }

  private hasTrigger(trigger: TooltipTrigger): boolean {
    if (Array.isArray(this.tooltipTrigger)) {
      return this.tooltipTrigger.includes(trigger);
    }
    return this.tooltipTrigger === trigger;
  }

  private scheduleShow(): void {
    if (!this.content || this.isVisible) return;
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.showTimer = window.setTimeout(() => this.show(), this.tooltipDelayShow);
  }

  private scheduleHide(): void {
    if (!this.isVisible) return;
    if (this.showTimer) {
      window.clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    this.hideTimer = window.setTimeout(() => this.hide(), this.tooltipDelayHide);
  }

  private show(): void {
    if (!this.content || this.isVisible) return;

    TooltipDirective.closeActiveTooltip(this);

    this.ensureTooltipElement();
    if (!this.tooltipEl) return;

    this.tooltipEl.textContent = this.content;
    this.tooltipEl.style.opacity = '0';
    this.tooltipEl.style.pointerEvents = 'none';
    this.tooltipEl.style.display = 'block';
    this.updatePosition();

    requestAnimationFrame(() => {
      if (!this.tooltipEl) return;
      this.tooltipEl.style.opacity = '1';
      this.tooltipEl.style.transform = 'translateY(0)';
    });

    this.isVisible = true;
    TooltipDirective.activeTooltip = this;
  }

  private hide(): void {
    if (!this.tooltipEl || !this.isVisible) {
      this.isVisible = false;
      return;
    }

    this.tooltipEl.style.opacity = '0';
    this.tooltipEl.style.pointerEvents = 'none';
    this.isVisible = false;

    if (TooltipDirective.activeTooltip === this) {
      TooltipDirective.activeTooltip = null;
    }
  }

  private ensureTooltipElement(): void {
    if (this.tooltipEl) return;

    const el = document.createElement('div');
    el.id = this.tooltipId;
    el.role = 'tooltip';
    el.className = 'app-tooltip app-tooltip--dark';
    el.style.position = 'fixed';
    el.style.zIndex = '9999';
    el.style.maxWidth = `${this.tooltipMaxWidth}px`;
    el.style.padding = '6px 10px';
    el.style.borderRadius = '8px';
    el.style.fontSize = '12px';
    el.style.lineHeight = '1.3';
    el.style.backgroundColor = '#020617';
    el.style.color = '#f9fafb';
    el.style.boxShadow = '0 10px 25px rgba(15,23,42,0.35)';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    el.style.transform = 'translateY(4px)';
    el.style.transition = 'opacity 120ms ease-out, transform 120ms ease-out';

    document.body.appendChild(el);
    this.tooltipEl = el;
  }

  private updatePosition(): void {
    if (!this.tooltipEl) return;

    const refRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tipRect = this.tooltipEl.getBoundingClientRect();
    const placements: TooltipPlacement[] =
      this.tooltipPlacement === 'auto'
        ? ['top', 'bottom', 'right', 'left']
        : [this.tooltipPlacement, 'top', 'bottom', 'right', 'left'];

    const margin = 8;
    let top = 0;
    let left = 0;

    for (const placement of placements) {
      const pos = this.computePosition(placement, refRect, tipRect, margin);
      if (this.fitsViewport(pos, tipRect)) {
        top = pos.top;
        left = pos.left;
        break;
      }
    }

    const padding = 4;
    const clampedLeft = Math.min(
      Math.max(left, padding),
      window.innerWidth - padding - tipRect.width,
    );
    const clampedTop = Math.min(
      Math.max(top, padding),
      window.innerHeight - padding - tipRect.height,
    );

    this.tooltipEl.style.top = `${clampedTop}px`;
    this.tooltipEl.style.left = `${clampedLeft}px`;
  }

  private computePosition(
    placement: TooltipPlacement,
    refRect: DOMRect,
    tipRect: DOMRect,
    margin: number,
  ): { top: number; left: number } {
    if (placement === 'top') {
      return {
        top: refRect.top - tipRect.height - margin,
        left: refRect.left,
      };
    }
    if (placement === 'bottom') {
      return {
        top: refRect.bottom + margin,
        left: refRect.left,
      };
    }
    if (placement === 'left') {
      return {
        top: refRect.top,
        left: refRect.left - tipRect.width - margin,
      };
    }
    if (placement === 'right') {
      return {
        top: refRect.top,
        left: refRect.right + margin,
      };
    }
    return { top: refRect.bottom + margin, left: refRect.left };
  }

  private fitsViewport(pos: { top: number; left: number }, tipRect: DOMRect): boolean {
    const padding = 4;
    const withinTop = pos.top >= padding;
    const withinLeft = pos.left >= padding;
    const withinRight = pos.left + tipRect.width <= window.innerWidth - padding;
    const withinBottom = pos.top + tipRect.height <= window.innerHeight - padding;
    return withinTop && withinLeft && withinRight && withinBottom;
  }

  private static ensureGlobalClickListener(): void {
    if (this.globalClickListenerInitialized) return;
    this.globalClickListenerInitialized = true;

    document.addEventListener(
      'click',
      event => {
        const active = TooltipDirective.activeTooltip;
        if (!active || !active.tooltipEl) return;

        const target = event.target as Node;
        const host = active.elementRef.nativeElement;
        const clickedInsideHost = host.contains(target);
        const clickedInsideTooltip = active.tooltipEl.contains(target);

        if (!clickedInsideHost && !clickedInsideTooltip) {
          active.hide();
        }
      },
      true,
    );
  }

  private static closeActiveTooltip(next: TooltipDirective): void {
    if (this.activeTooltip && this.activeTooltip !== next) {
      this.activeTooltip.hide();
    }
  }
}
