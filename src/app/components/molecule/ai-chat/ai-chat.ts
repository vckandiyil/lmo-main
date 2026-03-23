import { Component, signal } from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import { Icon } from '../../atom/icon/icon';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [TranslateModule, Icon],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
})
export class AiChat {
  isOpen = signal(false);
  isAnimating = signal(false);

  toggle(): void {
    if (this.isAnimating()) return;

    this.isAnimating.set(true);
    this.isOpen.update((value) => !value);

    setTimeout(() => {
      this.isAnimating.set(false);
    }, 300);
  }
}
