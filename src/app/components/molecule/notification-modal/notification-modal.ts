import {Component, inject, input, output, signal, effect} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {Icon} from '../../atom/icon/icon';
import {Button} from '../../atom/button/button';
import {NotificationService, NotificationGroup} from '../../../core';
import {LanguageService} from '../../../core/services/language.service';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [Icon, Button, TranslateModule],
  templateUrl: './notification-modal.html',
  styleUrl: './notification-modal.scss',
})
export class NotificationModal {
  private readonly notificationService = inject(NotificationService);
  private readonly languageService = inject(LanguageService);

  readonly isOpen = input<boolean>(false);
  readonly closed = output<void>();

  readonly isClosing = signal(false);
  readonly groups = signal<NotificationGroup[]>([]);

  constructor() {
    effect(() => {
      const lang = this.languageService.currentLanguage();
      if (this.isOpen()) {
        this.notificationService.getNotifications(lang).subscribe(data => {
          this.groups.set(data);
        });
      }
    });
  }

  onBackdropClick(): void {
    this.close();
  }

  onContentClick(event: Event): void {
    event.stopPropagation();
  }

  close(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      this.isClosing.set(false);
      this.closed.emit();
    }, 300);
  }
}
