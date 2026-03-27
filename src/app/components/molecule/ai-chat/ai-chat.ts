import { Component, computed, inject, signal } from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import { Icon } from '../../atom/icon/icon';
import { animate, style, transition, trigger } from '@angular/animations';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [TranslateModule, Icon],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX({{from}})' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' })),
      ], { params: { from: '100%' } }),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX({{from}})' })),
      ], { params: { from: '100%' } }),
    ]),
  ],
})
export class AiChat {
  private langService = inject(LanguageService);

  isOpen = signal(false);
  isAnimating = signal(false);

  animationParams = computed(() => ({
    value: 'open',
    params: { from: this.langService.isRtl() ? '-100%' : '100%' },
  }));

  toggle(): void {
    if (this.isAnimating()) return;

    this.isAnimating.set(true);
    this.isOpen.update((value) => !value);

    setTimeout(() => {
      this.isAnimating.set(false);
    }, 300);
  }
}
