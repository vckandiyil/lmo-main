import {Component, ElementRef, HostListener, effect, input, output, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Icon} from '../icon/icon';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss'
})
export class Dropdown {
  placeholder = input<string>('Select an option');
  options = input<string[]>([]);
  variant = input<'primary' | 'secondary'>('primary');
  noArrow = input<boolean>(false);
  value = input<string | null>(null);
  label = input<string | null>(null);
  multi = input<boolean>(false);
  multiValue = input<string[]>([]);
  selected = output<string>();
  multiSelected = output<string[]>();

  isOpen = signal(false);
  selectedValue = signal<string | null>(null);
  selectedMultiValues = signal<string[]>([]);
  newValue = signal<string | null>(null);
  previousValue = signal<string | null>(null);
  isAnimating = signal(false);

  readonly multiDisplayValue = computed(() => {
    const vals = this.selectedMultiValues();
    if (vals.length === 0) return null;
    if (vals.length === 1) return vals[0];
    return `${vals.length} selected`;
  });

  constructor(private elementRef: ElementRef) {
    effect(() => {
      this.selectedValue.set(this.value());
    });
    effect(() => {
      this.selectedMultiValues.set(this.multiValue());
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  toggle() {
    if (this.isAnimating()) return;

    if (!this.isOpen() && this.selectedValue()) {
      this.previousValue.set(this.selectedValue());
      this.newValue.set(null);
      this.isAnimating.set(true);
      this.isOpen.set(true);

      setTimeout(() => {
        this.isAnimating.set(false);
        this.previousValue.set(null);
        this.newValue.set(null);
      }, 300);
    } else {
      this.isOpen.update(v => !v);
    }
  }

  select(option: string) {
    if (this.isAnimating()) return;

    this.previousValue.set(null);
    this.newValue.set(option);
    this.selectedValue.set(option);
    this.isAnimating.set(true);
    this.selected.emit(option);
    this.isOpen.set(false);

    setTimeout(() => {
      this.isAnimating.set(false);
      this.previousValue.set(null);
      this.newValue.set(null);
    }, 300);
  }

  toggleMulti(option: string): void {
    this.selectedMultiValues.update(vals => {
      const updated = vals.includes(option) ? vals.filter(v => v !== option) : [...vals, option];
      this.multiSelected.emit(updated);
      return updated;
    });
  }

  isMultiChecked(option: string): boolean {
    return this.selectedMultiValues().includes(option);
  }

  reset() {
    if (this.isAnimating()) return;

    if (this.selectedValue()) {
      this.previousValue.set(this.selectedValue());
      this.newValue.set(null);
      this.isAnimating.set(true);
      this.selectedValue.set(null);

      setTimeout(() => {
        this.isAnimating.set(false);
        this.previousValue.set(null);
        this.newValue.set(null);
      }, 300);
    }
  }
}
