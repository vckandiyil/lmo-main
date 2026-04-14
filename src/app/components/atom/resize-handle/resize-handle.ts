import {Component, inject, input, NgZone, OnDestroy, signal} from '@angular/core';
import {DOCUMENT} from '@angular/common';

@Component({
  selector: 'app-resize-handle',
  standalone: true,
  template: `
    <div class="resize-handle" (mousedown)="onMouseDown($event)" (touchstart)="onTouchStart($event)">
      <div class="resize-handle__tooltip">
        <span class="resize-handle__pct resize-handle__pct--left">{{ leftPct() }}%</span>
        <svg class="resize-handle__icon"
             (mousedown)="onIconMouseDown($event)"
             (touchstart)="onIconTouchStart($event)"
             width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8h12M2 8l2.5-2.5M2 8l2.5 2.5M14 8l-2.5-2.5M14 8l-2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="resize-handle__pct resize-handle__pct--right">{{ rightPct() }}%</span>
      </div>
    </div>
  `,
  styleUrl: './resize-handle.scss',
})
export class ResizeHandle implements OnDestroy {
  side = input.required<'left' | 'right'>();

  leftPct = signal(25);
  rightPct = signal(50);

  private readonly ngZone = inject(NgZone);
  private readonly doc = inject(DOCUMENT);

  private dragging = false;
  private linkedMode = false;
  private mouseMoveListener: ((e: MouseEvent) => void) | null = null;
  private mouseUpListener: ((e: MouseEvent) => void) | null = null;
  private touchMoveListener: ((e: TouchEvent) => void) | null = null;
  private touchEndListener: ((e: TouchEvent) => void) | null = null;

  /** Drag the line — single sidebar */
  onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.linkedMode = false;
    this.startDrag();
  }

  onTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    this.linkedMode = false;
    this.startDragTouch();
  }

  /** Drag the icon — both sidebars */
  onIconMouseDown(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.linkedMode = true;
    this.startDrag();
  }

  onIconTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    this.linkedMode = true;
    this.startDragTouch();
  }

  private getNav(): number {
    return parseFloat(getComputedStyle(this.doc.documentElement).getPropertyValue('--nav-sidebar-w')) || 88;
  }

  private updatePctSignals(nav: number): void {
    const available = window.innerWidth - nav;
    const leftW = parseFloat(getComputedStyle(this.doc.documentElement).getPropertyValue('--sidebar-left-w')) || available * 0.25;
    const rightW = parseFloat(getComputedStyle(this.doc.documentElement).getPropertyValue('--sidebar-right-w')) || available * 0.25;

    if (this.side() === 'left') {
      this.leftPct.set(Math.round((leftW / available) * 100));
      this.rightPct.set(Math.round(((available - leftW - rightW) / available) * 100));
    } else {
      this.leftPct.set(Math.round(((available - leftW - rightW) / available) * 100));
      this.rightPct.set(Math.round((rightW / available) * 100));
    }
  }

  private startDrag(): void {
    this.dragging = true;
    this.doc.body.classList.add('sidebar-resizing');
    this.doc.body.style.cursor = 'col-resize';
    this.doc.body.style.userSelect = 'none';

    const nav = this.getNav();
    const available = window.innerWidth - nav;
    const minW = available * 0.25;
    const maxW = available * 0.40;

    this.ngZone.runOutsideAngular(() => {
      this.mouseMoveListener = (e: MouseEvent) => {
        if (!this.dragging) return;
        this.updateWidth(e.clientX, nav, minW, maxW);
        this.updatePctSignals(nav);
      };
      this.mouseUpListener = () => this.stopDrag();

      this.doc.addEventListener('mousemove', this.mouseMoveListener);
      this.doc.addEventListener('mouseup', this.mouseUpListener);
    });
  }

  private startDragTouch(): void {
    this.dragging = true;
    this.doc.body.classList.add('sidebar-resizing');
    this.doc.body.style.userSelect = 'none';

    const nav = this.getNav();
    const available = window.innerWidth - nav;
    const minW = available * 0.25;
    const maxW = available * 0.40;

    this.ngZone.runOutsideAngular(() => {
      this.touchMoveListener = (e: TouchEvent) => {
        if (!this.dragging || e.touches.length !== 1) return;
        this.updateWidth(e.touches[0].clientX, nav, minW, maxW);
        this.updatePctSignals(nav);
      };
      this.touchEndListener = () => this.stopDrag();

      this.doc.addEventListener('touchmove', this.touchMoveListener, {passive: false});
      this.doc.addEventListener('touchend', this.touchEndListener);
    });
  }

  private updateWidth(clientX: number, nav: number, minW: number, maxW: number): void {
    const isRtl = this.doc.documentElement.getAttribute('dir') === 'rtl';
    let width: number;

    if (this.side() === 'left') {
      width = isRtl
        ? window.innerWidth - clientX
        : clientX - nav;
    } else {
      width = isRtl
        ? clientX - nav
        : window.innerWidth - clientX;
    }

    width = Math.max(minW, Math.min(maxW, width));

    if (this.linkedMode) {
      // Both sidebars get the same width
      this.doc.documentElement.style.setProperty('--sidebar-left-w', `${width}px`);
      this.doc.documentElement.style.setProperty('--sidebar-right-w', `${width}px`);
    } else {
      const prop = this.side() === 'left' ? '--sidebar-left-w' : '--sidebar-right-w';
      this.doc.documentElement.style.setProperty(prop, `${width}px`);
    }
  }

  private stopDrag(): void {
    this.dragging = false;
    this.linkedMode = false;
    this.doc.body.classList.remove('sidebar-resizing');
    this.doc.body.style.cursor = '';
    this.doc.body.style.userSelect = '';

    if (this.mouseMoveListener) {
      this.doc.removeEventListener('mousemove', this.mouseMoveListener);
      this.mouseMoveListener = null;
    }
    if (this.mouseUpListener) {
      this.doc.removeEventListener('mouseup', this.mouseUpListener);
      this.mouseUpListener = null;
    }
    if (this.touchMoveListener) {
      this.doc.removeEventListener('touchmove', this.touchMoveListener);
      this.touchMoveListener = null;
    }
    if (this.touchEndListener) {
      this.doc.removeEventListener('touchend', this.touchEndListener);
      this.touchEndListener = null;
    }
  }

  ngOnDestroy(): void {
    this.stopDrag();
  }
}
