import {Injectable, signal} from '@angular/core';

export type LayoutMode = '3col' | '4col';

@Injectable({providedIn: 'root'})
export class LayoutService {
  readonly layoutMode = signal<LayoutMode>('3col');
  readonly mobileNavOpen = signal(false);
  // Increments each time a UI element (e.g. the responsive filters panel)
  // requests opening the "Add widget" picker. The sidebar component watches
  // this counter and opens its widget center when it changes.
  readonly addWidgetRequestId = signal(0);
  readonly searchModalRequestId = signal(0);
  readonly reportModalRequestId = signal(0);
  readonly aiChatRequestId = signal(0);

  setLayoutMode(mode: LayoutMode): void {
    this.layoutMode.set(mode);
  }

  openMobileNav(): void {
    this.mobileNavOpen.set(true);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  requestAddWidget(): void {
    this.addWidgetRequestId.update((v) => v + 1);
  }

  requestSearchModal(): void {
    this.searchModalRequestId.update((v) => v + 1);
  }

  requestReportModal(): void {
    this.reportModalRequestId.update((v) => v + 1);
  }

  requestAiChat(): void {
    this.aiChatRequestId.update((v) => v + 1);
  }
}
