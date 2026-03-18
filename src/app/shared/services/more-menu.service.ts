import {Injectable, signal} from '@angular/core';

@Injectable({providedIn: 'root'})
export class MoreMenuService {
  private readonly activeId = signal<string | null>(null);

  open(id: string): void {
    this.activeId.set(id);
  }

  close(): void {
    this.activeId.set(null);
  }

  isOpen(id: string): boolean {
    return this.activeId() === id;
  }
}
