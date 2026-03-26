import {Component, effect, inject, signal} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {Icon} from '../../atom/icon/icon';
import {ThemeService, LanguageService} from '../../../core';
import {NotificationModal} from '../../molecule/notification-modal/notification-modal';

@Component({
  selector: 'app-nav-sidebar',
  standalone: true,
  imports: [Icon, NotificationModal, RouterLink, RouterLinkActive],
  templateUrl: './nav-sidebar.html',
  styleUrl: './nav-sidebar.scss',
})
export class NavSidebar {
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService);
  private readonly languageService = inject(LanguageService);

  protected readonly expanded = signal(false);
  protected readonly isDarkMode = this.themeService.isDarkMode;
  protected readonly isRtl = this.languageService.isRtl;
  protected readonly isNotificationModalOpen = signal(false);

  constructor() {
    effect(() => {
      this.document.documentElement.style.setProperty(
        '--nav-sidebar-w',
        this.expanded() ? '326px' : '88px'
      );
    });
  }

  toggle(): void {
    this.expanded.update(v => !v);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  openNotificationModal(): void {
    this.isNotificationModalOpen.set(true);
  }

  closeNotificationModal(): void {
    this.isNotificationModalOpen.set(false);
  }
}
