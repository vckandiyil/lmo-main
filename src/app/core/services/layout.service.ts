import {Injectable, signal} from '@angular/core';

export type LayoutMode = '3col' | '4col';

@Injectable({providedIn: 'root'})
export class LayoutService {
  readonly layoutMode = signal<LayoutMode>('3col');
  readonly mobileNavOpen = signal(false);

  setLayoutMode(mode: LayoutMode): void {
    this.layoutMode.set(mode);
  }

  openMobileNav(): void {
    this.mobileNavOpen.set(true);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }
}
