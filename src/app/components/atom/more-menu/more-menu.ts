import {Component, input, output, signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {Icon} from '../icon/icon';

export interface MoreMenuItem {
  icon: string;
  label: string;
  value?: string;
  children?: MoreMenuItem[];
}

@Component({
  selector: 'app-more-menu',
  standalone: true,
  imports: [Icon, TranslateModule],
  template: `
    <div class="more-menu" (mousedown)="$event.stopPropagation()" (click)="$event.stopPropagation()">
      @for (item of items(); track item.label) {
        <div
          class="more-menu__item"
          [class.more-menu__item--expandable]="item.children?.length"
          [class.more-menu__item--expanded]="expandedLabel() === item.label"
          (click)="onItemClick(item)">
          <app-icon [name]="item.icon" size="20" class="more-menu__icon" />
          <span class="more-menu__label">{{ item.label | translate }}</span>
          @if (item.children?.length) {
            <app-icon
              [name]="expandedLabel() === item.label ? 'nav-arrow-up' : 'nav-arrow-down'"
              size="14"
              class="more-menu__chevron"/>
          }
        </div>
        @if (item.children?.length && expandedLabel() === item.label) {
          <div class="more-menu__children">
            @for (child of item.children; track child.label) {
              <div class="more-menu__child" (click)="onChildClick(child)">
                <app-icon [name]="child.icon" size="16" class="more-menu__icon" />
                <span class="more-menu__label">{{ child.label | translate }}</span>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styleUrl: './more-menu.scss',
})
export class MoreMenu {
  readonly items = input<MoreMenuItem[]>([]);
  readonly itemClicked = output<MoreMenuItem>();

  readonly expandedLabel = signal<string | null>(null);

  onItemClick(item: MoreMenuItem): void {
    if (item.children?.length) {
      this.expandedLabel.set(this.expandedLabel() === item.label ? null : item.label);
    } else {
      this.itemClicked.emit(item);
    }
  }

  onChildClick(child: MoreMenuItem): void {
    this.expandedLabel.set(null);
    this.itemClicked.emit(child);
  }
}
