import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable, shareReplay} from 'rxjs';
import type {WidgetCatalogEntry, WidgetsCatalog} from '../models/widget-catalog.model';
import {API_BASE_URL} from '../tokens/api-base-url.token';

@Injectable({providedIn: 'root'})
export class WidgetCatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly catalog$ = this.http
    .get<WidgetsCatalog>(`${this.baseUrl}/widgets-catalog.json`)
    .pipe(shareReplay(1));

  /** Only widgets that have a sidebar component and are not hidden. */
  getSidebarWidgets(): Observable<WidgetCatalogEntry[]> {
    return this.catalog$.pipe(map(c => c.widgets.filter(w => w.hasSidebarComponent && !w.hidden)));
  }

  /** Unique category names from the catalog, preserving insertion order. */
  getTopics(): Observable<string[]> {
    return this.catalog$.pipe(
      map(c => [...new Set(c.widgets.filter(w => !w.hidden).flatMap(w => w.category))])
    );
  }

  /** Widgets belonging to a category that have a sidebar component and are not hidden. */
  getWidgetsByCategory(category: string): Observable<WidgetCatalogEntry[]> {
    return this.catalog$.pipe(
      map(c => c.widgets.filter(w => w.category.includes(category) && w.hasSidebarComponent && !w.hidden))
    );
  }

  /** Widgets that have a detail view and are not hidden. */
  getDetailViewWidgets(): Observable<WidgetCatalogEntry[]> {
    return this.catalog$.pipe(map(c => c.widgets.filter(w => w.hasDetailView && !w.hidden)));
  }

  /** Single widget entry by id. */
  getWidgetById(id: string): Observable<WidgetCatalogEntry | undefined> {
    return this.catalog$.pipe(map(c => c.widgets.find(w => w.id === id)));
  }
}
