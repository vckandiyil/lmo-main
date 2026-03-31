import {Component, effect, inject, signal} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {Icon} from '../../atom/icon/icon';
import {ThemeService, LanguageService} from '../../../core';
import {NotificationModal} from '../../molecule/notification-modal/notification-modal';
import {ReportModal} from '../../molecule/report-modal/report-modal';

@Component({
  selector: 'app-nav-sidebar',
  standalone: true,
  imports: [Icon, NotificationModal, ReportModal, RouterLink, RouterLinkActive],
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
  protected readonly isReportModalOpen = signal(false);

  private readonly mobileQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 767.98px)')
    : null;
  private readonly isMobile = signal(this.mobileQuery?.matches ?? false);

  constructor() {
    this.mobileQuery?.addEventListener('change', (e) => this.isMobile.set(e.matches));

    effect(() => {
      if (this.isMobile()) {
        // On mobile the CSS :root media query sets 48px; don't override it.
        this.document.documentElement.style.removeProperty('--nav-sidebar-w');
      } else {
        this.document.documentElement.style.setProperty(
          '--nav-sidebar-w',
          this.expanded() ? '275px' : '88px'
        );
      }
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

  openReportModal(): void {
    this.isReportModalOpen.set(true);
  }

  closeReportModal(): void {
    this.isReportModalOpen.set(false);
  }
}
