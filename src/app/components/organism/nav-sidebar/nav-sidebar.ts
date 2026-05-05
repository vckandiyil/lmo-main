import {Component, computed, effect, inject, signal} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {NavigationEnd, Router, RouterLink, RouterLinkActive} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {filter, map, startWith} from 'rxjs';
import {Icon} from '../../atom/icon/icon';
import {ThemeService, LanguageService, LayoutService} from '../../../core';
import {NotificationModal} from '../../molecule/notification-modal/notification-modal';
import {NavTooltipDirective} from './nav-tooltip.directive';

@Component({
  selector: 'app-nav-sidebar',
  standalone: true,
  imports: [Icon, NotificationModal, RouterLink, RouterLinkActive, NavTooltipDirective],
  templateUrl: './nav-sidebar.html',
  styleUrl: './nav-sidebar.scss',
})
export class NavSidebar {
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService);
  private readonly languageService = inject(LanguageService);
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

  protected readonly expanded = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    {initialValue: this.router.url}
  );

  private readonly manualInsights = signal<boolean | undefined>(undefined);
  private readonly manualSector = signal<boolean | undefined>(undefined);
  private readonly manualDecision = signal<boolean | undefined>(undefined);

  protected readonly sectorExpanded = computed(() =>
    this.manualSector() ?? false
  );
  protected readonly insightsExpanded = computed(() =>
    this.manualInsights() ?? (this.currentUrl().startsWith('/labor-market-insights') || this.sectorExpanded())
  );
  protected readonly decisionExpanded = computed(() =>
    this.manualDecision() ?? (
      this.currentUrl().startsWith('/gap-analysis') ||
      this.currentUrl().startsWith('/forecast') ||
      this.currentUrl().startsWith('/what-if')
    )
  );
  protected readonly isDarkMode = this.themeService.isDarkMode;
  protected readonly isRtl = this.languageService.isRtl;
  protected readonly isNotificationModalOpen = signal(false);
  protected readonly mobileNavOpen = this.layoutService.mobileNavOpen;

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

  toggleInsights(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.expanded()) {
      this.expanded.set(true);
    }
    this.manualInsights.set(!this.insightsExpanded());
  }

  toggleSector(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.expanded()) {
      this.expanded.set(true);
    }
    this.manualSector.set(!this.sectorExpanded());
  }

  toggleDecision(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.expanded()) {
      this.expanded.set(true);
    }
    this.manualDecision.set(!this.decisionExpanded());
  }

  preventNav(event: Event): void {
    event.preventDefault();
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

  closeMobileNav(): void {
    this.layoutService.closeMobileNav();
  }
}
