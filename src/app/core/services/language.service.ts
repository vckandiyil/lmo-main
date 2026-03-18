import { Injectable, inject, signal, computed } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLanguage = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  private readonly _currentLanguage = signal<SupportedLanguage>('en');

  readonly currentLanguage = this._currentLanguage.asReadonly();
  readonly isRtl = computed(() => this._currentLanguage() === 'ar');

  readonly supportedLanguages: readonly SupportedLanguage[] = ['en', 'ar'];

  constructor() {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    const stored = localStorage.getItem('language') as SupportedLanguage | null;
    const browserLang = this.translate.getBrowserLang() as SupportedLanguage | undefined;
    const defaultLang: SupportedLanguage = stored ??
      (browserLang && this.supportedLanguages.includes(browserLang) ? browserLang : 'en');

    this.setLanguage(defaultLang);
  }

  setLanguage(lang: SupportedLanguage): void {
    this._currentLanguage.set(lang);
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }

  toggleLanguage(): void {
    const newLang = this._currentLanguage() === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }
}
