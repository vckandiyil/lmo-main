import {Component, inject, effect, computed, signal} from '@angular/core';
import {RouterOutlet, Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs';
import {LanguageService} from './core';
import {NavSidebar} from './components/organism/nav-sidebar/nav-sidebar';
import {AiChat} from './components/molecule/ai-chat/ai-chat';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavSidebar, AiChat],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '[attr.dir]': 'direction()',
    '[class.rtl]': 'isRtl()',
    '[class.page--lmi]': 'isLaborMarketInsights()',
    '[class.page--home]': 'isHome()',
    '[class.page--my-lmo]': 'isMyLmo()'
  }
})
export class App {
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  protected readonly isRtl = this.languageService.isRtl;
  protected readonly direction = computed(() => this.isRtl() ? 'rtl' : 'ltr');
  protected readonly isLaborMarketInsights = signal(false);
  protected readonly isHome = signal(false);
  protected readonly isMyLmo = signal(false);

  constructor() {
    effect(() => {
      document.documentElement.dir = this.direction();
      document.body.dir = this.direction();
    });

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = e.urlAfterRedirects;
        this.isLaborMarketInsights.set(
          url.startsWith('/labor-market-insights') ||
          url.startsWith('/gap-analysis') ||
          url.startsWith('/what-if') ||
          url.startsWith('/forecast')
        );
        this.isHome.set(url === '/');
        this.isMyLmo.set(url.startsWith('/my-lmo'));
      });
  }
}
