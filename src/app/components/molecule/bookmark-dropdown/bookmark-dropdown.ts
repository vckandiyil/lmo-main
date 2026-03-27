import {Component, DestroyRef, ElementRef, inject, input, NgZone, OnInit, output, signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {Button} from '../../atom/button/button';
import {Icon} from '../../atom/icon/icon';

@Component({
  selector: 'app-bookmark-dropdown',
  standalone: true,
  imports: [Button, Icon, TranslateModule],
  templateUrl: './bookmark-dropdown.html',
  styleUrl: './bookmark-dropdown.scss',
})
export class BookmarkDropdown implements OnInit {
  private readonly elRef      = inject(ElementRef);
  private readonly ngZone     = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly presetNames  = input.required<string[]>();
  readonly isBookmarked = input<boolean>(false);
  readonly presetSelected = output<string>();

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

  protected selectPreset(name: string): void {
    this.presetSelected.emit(name);
    this.isOpen.set(false);
  }
}
