import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>('light');

  readonly theme = this._theme.asReadonly();
  readonly isDarkMode = computed(() => this._theme() === 'dark');

  constructor() {
    this.initializeTheme();

    effect(() => {
      const theme = this._theme();
      document.body.classList.toggle('theme--dark', theme === 'dark');
      document.body.classList.toggle('theme--light', theme === 'light');
    });
  }

  private initializeTheme(): void {
    const stored = localStorage.getItem('theme') as Theme | null;
    const defaultTheme: Theme = stored ?? 'light';
    this._theme.set(defaultTheme);
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem('theme', theme);
  }

  toggleTheme(): void {
    const newTheme = this._theme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
}
