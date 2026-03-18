import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable, shareReplay} from 'rxjs';
import {Notification, NotificationGroup} from '../models/notification.model';
import {API_BASE_URL} from '../tokens/api-base-url.token';

@Injectable({providedIn: 'root'})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly cache = new Map<string, Observable<NotificationGroup[]>>();

  getNotifications(lang: string = 'en'): Observable<NotificationGroup[]> {
    if (!this.cache.has(lang)) {
      const request$ = this.http.get<Notification[]>(`${this.baseUrl}/notifications.json`).pipe(
        map(notifications => this.groupByMonth(notifications, lang)),
        shareReplay(1)
      );
      this.cache.set(lang, request$);
    }
    return this.cache.get(lang)!;
  }

  private groupByMonth(notifications: Notification[], lang: string): NotificationGroup[] {
    const groups = new Map<string, Notification[]>();

    for (const notification of notifications) {
      const month = this.formatMonth(notification.created_date, lang);
      const existing = groups.get(month) ?? [];
      existing.push({
        ...notification,
        message: lang === 'ar' && notification.message_ar ? notification.message_ar : notification.message
      });
      groups.set(month, existing);
    }

    return Array.from(groups.entries()).map(([month, items]) => ({
      month,
      notifications: items
    }));
  }

  private formatMonth(dateString: string, lang: string): string {
    const date = new Date(dateString);
    const locale = lang === 'ar' ? 'ar-AE' : 'en-US';
    return date.toLocaleString(locale, {month: 'long', year: 'numeric'});
  }
}
