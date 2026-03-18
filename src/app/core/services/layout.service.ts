import {Injectable, signal} from '@angular/core';

export type LayoutMode = '3col' | '4col';

@Injectable({providedIn: 'root'})
export class LayoutService {
  readonly layoutMode = signal<LayoutMode>('3col');

  setLayoutMode(mode: LayoutMode): void {
    this.layoutMode.set(mode);
  }
}
