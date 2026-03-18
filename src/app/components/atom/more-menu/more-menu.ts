import {Component, input} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {Icon} from '../icon/icon';

export interface MoreMenuItem {
  icon: string;
  label: string;
}

@Component({
  selector: 'app-more-menu',
  standalone: true,
  imports: [Icon, TranslateModule],
  template: `
    <div class="more-menu" (mousedown)="$event.stopPropagation()" (click)="$event.stopPropagation()">
      @for (item of items(); track item.label) {
        <div class="more-menu__item">
          <app-icon [name]="item.icon" size="20" class="more-menu__icon" />
          <span class="more-menu__label">{{ item.label | translate }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './more-menu.scss',
})
export class MoreMenu {
  readonly items = input<MoreMenuItem[]>([]);
}
