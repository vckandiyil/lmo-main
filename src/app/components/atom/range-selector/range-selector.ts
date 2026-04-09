import {AfterViewChecked, Component, computed, ElementRef, inject, input, output, signal} from '@angular/core';

export interface RangeOption {
  id: string;
  label: string;
  value: number | null;
}

const RANGE_OPTION: RangeOption = {id: '__range__', label: 'Range', value: -1};

@Component({
  selector: 'app-range-selector',
  standalone: true,
  templateUrl: './range-selector.html',
  styleUrl: './range-selector.scss',
})
export class RangeSelector implements AfterViewChecked {
  readonly options = input.required<RangeOption[]>();
  readonly activeValue = input.required<string>();
  readonly rangeChanged = output<string>();
  readonly rangeToggled = output<boolean>();

  private el = inject(ElementRef);

  private readonly isDragging = signal(false);
  private readonly dragIndex = signal(-1);
  private readonly rangeActive = signal(false);

  /** Options: Range first, then numeric (3Y, 5Y, 10Y), then All last */
  readonly allOptions = computed(() => {
    const opts = this.options();
    const allIdx = opts.findIndex(o => o.value === null);
    const reordered = [...opts];
    if (allIdx >= 0) {
      const [allOpt] = reordered.splice(allIdx, 1);
      reordered.push(allOpt);
    }
    reordered.unshift(RANGE_OPTION);
    return reordered;
  });

  protected readonly displayIndex = computed(() => {
    if (this.isDragging()) return this.dragIndex();
    if (this.rangeActive()) return 0;
    return this.allOptions().findIndex(o => o.id !== RANGE_OPTION.id && this.resolveValue(o) === this.activeValue());
  });

  ngAfterViewChecked(): void {
    this.updateTrackPosition();
  }

  protected resolveValue(option: RangeOption): string {
    return option.value === null ? 'ALL' : '' + option.value;
  }

  protected startDrag(event: PointerEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.isDragging.set(true);
    this.dragIndex.set(this.findClosestIndex(event.clientX));
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.isDragging()) return;
    this.dragIndex.set(this.findClosestIndex(event.clientX));
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    const opt = this.allOptions()[this.dragIndex()];
    if (!opt) return;

    if (opt.id === RANGE_OPTION.id) {
      // Selected "Range" → enable navigator
      this.rangeActive.set(true);
      this.rangeToggled.emit(true);
    } else {
      // Selected a regular option → disable navigator if active
      if (this.rangeActive()) {
        this.rangeActive.set(false);
        this.rangeToggled.emit(false);
      }
      this.rangeChanged.emit(this.resolveValue(opt));
    }
  }

  private findClosestIndex(clientX: number): number {
    const dots = this.el.nativeElement.querySelectorAll('.range-selector__dot');
    let closestIdx = 0;
    let minDist = Infinity;
    dots.forEach((dot: Element, i: number) => {
      const rect = dot.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const dist = Math.abs(clientX - centerX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    });
    return closestIdx;
  }

  private updateTrackPosition(): void {
    const root: HTMLElement = this.el.nativeElement;
    const track = root.querySelector<HTMLElement>('.range-selector__track');
    const dots = root.querySelectorAll('.range-selector__dot');

    if (!track || dots.length < 2) return;

    const parentRect = track.parentElement!.getBoundingClientRect();
    const firstDotRect = dots[0].getBoundingClientRect();
    const lastDotRect = dots[dots.length - 1].getBoundingClientRect();

    const leftDot = firstDotRect.left <= lastDotRect.left ? firstDotRect : lastDotRect;
    const rightDot = firstDotRect.left >= lastDotRect.left ? firstDotRect : lastDotRect;

    const left = leftDot.left + leftDot.width / 2 - parentRect.left;
    const right = parentRect.right - rightDot.left - rightDot.width / 2;

    track.style.left = `${left}px`;
    track.style.right = `${right}px`;
  }
}
