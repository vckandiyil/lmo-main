import {Directive, ElementRef, HostListener, OnDestroy, effect, inject, input} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {LanguageService} from '../../../core';

@Directive({
  selector: '[appNavTooltip]',
  standalone: true,
})
export class NavTooltipDirective implements OnDestroy {
  readonly text = input.required<string>({alias: 'appNavTooltip'});
  readonly disabled = input<boolean>(false, {alias: 'navTooltipDisabled'});

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly languageService = inject(LanguageService);

  private tooltipEl: HTMLDivElement | null = null;
  private scrollHandler: (() => void) | null = null;

  constructor() {
    effect(() => {
      if (this.disabled() && this.tooltipEl) {
        this.hide();
      }
    });
  }

  @HostListener('mouseenter')
  onEnter(): void {
    this.show();
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.hide();
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private show(): void {
    if (this.disabled() || this.tooltipEl) return;

    const rect = this.host.nativeElement.getBoundingClientRect();
    const el = this.document.createElement('div');
    el.className = 'nav-tooltip';
    el.textContent = this.text();
    Object.assign(el.style, {
      position: 'fixed',
      top: `${rect.top + rect.height / 2}px`,
      transform: 'translateY(-50%)',
      background: '#1E2937',
      color: '#FFFFFF',
      fontFamily: 'sans-serif',
      fontSize: '12px',
      lineHeight: '18px',
      padding: '4px 10px',
      borderRadius: '6px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: '1000',
    } satisfies Partial<CSSStyleDeclaration>);

    if (this.languageService.isRtl()) {
      el.style.right = `${this.document.defaultView!.innerWidth - rect.left + 8}px`;
    } else {
      el.style.left = `${rect.right + 8}px`;
    }

    this.document.body.appendChild(el);
    this.tooltipEl = el;

    this.scrollHandler = () => this.hide();
    this.document.defaultView!.addEventListener('scroll', this.scrollHandler, true);
  }

  private hide(): void {
    if (this.scrollHandler) {
      this.document.defaultView!.removeEventListener('scroll', this.scrollHandler, true);
      this.scrollHandler = null;
    }
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
  }
}
