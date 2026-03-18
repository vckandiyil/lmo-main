import { Component, input, output } from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class AiChat {
  isOpen = input<boolean>(false);
  isExpanded = input<boolean>(false);
  closed = output<void>();
  expandToggled = output<void>();

  onExpandClick(): void {
    this.expandToggled.emit();
  }
}
