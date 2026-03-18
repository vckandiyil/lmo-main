import {Component, DestroyRef, ElementRef, inject, input, NgZone, OnInit, output, signal} from '@angular/core';
import {Button} from '../../atom/button/button';
import {Icon} from '../../atom/icon/icon';

export interface CompareItem {
  id: string;
  title: string;
  color: string;
  selected: boolean;
}

@Component({
  selector: 'app-compare-dropdown',
  standalone: true,
  imports: [Button, Icon],
  templateUrl: './compare-dropdown.html',
  styleUrl: './compare-dropdown.scss',
})
export class CompareDropdown implements OnInit {
  private readonly elRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = input.required<CompareItem[]>();
  readonly toggled = output<string>();

  protected readonly isOpen = signal(false);

  ngOnInit(): void {
    const handler = (event: MouseEvent) => {
      if (this.isOpen() && !this.elRef.nativeElement.contains(event.target as Node)) {
        this.ngZone.run(() => this.isOpen.set(false));
      }
    };
    document.addEventListener('click', handler, true);
    this.destroyRef.onDestroy(() => document.removeEventListener('click', handler, true));
  }

  protected toggle(): void {
    this.isOpen.update(v => !v);
  }

  protected selectItem(id: string): void {
    this.toggled.emit(id);
  }
}
