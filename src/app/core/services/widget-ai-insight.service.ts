import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {combineLatest, map, Observable, shareReplay} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {API_BASE_URL} from '../tokens/api-base-url.token';
import {LanguageService} from './language.service';

type InsightRecord = Record<string, {en: string; ar: string}>;

@Injectable({providedIn: 'root'})
export class WidgetAiInsightService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly languageService = inject(LanguageService);

  private readonly insights$ = this.http
    .get<InsightRecord>(`${this.baseUrl}/widget-ai-insights.json`)
    .pipe(shareReplay(1));

  private readonly lang$ = toObservable(this.languageService.currentLanguage);

  getText(widgetType: string): Observable<string> {
    return combineLatest([this.insights$, this.lang$]).pipe(
      map(([insights, lang]) => insights[widgetType]?.[lang] ?? ''),
    );
  }
}
