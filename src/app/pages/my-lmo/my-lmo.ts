import {Component, signal, ViewChild} from '@angular/core';
import {Sidebar} from '../../components/organism/sidebar/sidebar';
import {Icon} from '../../components/atom/icon/icon';

@Component({
  selector: 'app-my-lmo',
  standalone: true,
  imports: [Sidebar, Icon],
  templateUrl: './my-lmo.html',
  styleUrl: './my-lmo.scss',
})
export class MyLmoPage {
  @ViewChild(Sidebar) private sidebarRef!: Sidebar;

  protected readonly searchValue = signal('');

  onSearchInput(event: Event): void {
    this.searchValue.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchValue.set('');
  }

  openWidgetCenter(): void {
    this.sidebarRef.openWidgetCenter('left');
  }
}
