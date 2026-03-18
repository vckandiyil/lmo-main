import { Component, input, output, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-tab-group',
  standalone: true,
  imports: [NgClass, TranslateModule],
  templateUrl: './tab-group.html',
  styleUrl: './tab-group.scss',
})
export class TabGroup {
  readonly tabs = input.required<TabItem[]>();
  readonly activeTab = input.required<string>();
  readonly tabChanged = output<string>();

  selectTab(tabId: string): void {
    this.tabChanged.emit(tabId);
  }

  isActive(tabId: string): boolean {
    return this.activeTab() === tabId;
  }
}
