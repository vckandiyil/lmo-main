import {Component, computed, effect, ElementRef, inject, input, output, signal, Type, untracked, ViewChild} from '@angular/core';
import {NgComponentOutlet} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {animate, style, transition, trigger} from '@angular/animations';
import {HttpClient} from '@angular/common/http';
import {API_BASE_URL} from '../../../core/tokens/api-base-url.token';
import {WidgetType} from '../../../core';
import type {AiOverviewResponse, AiOverview} from '../../../core';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import {ALL_WIDGET_COMPONENTS, WIDGET_COMPONENT_MAP} from '../widgets';
import {GenericWidgetCard} from '../../molecule/generic-widget-card/generic-widget-card';
import {MapWidgetCard} from '../../molecule/map-widget-card/map-widget-card';
import {Icon} from '../../atom/icon/icon';
import type {WidgetCatalogEntry} from '../../../core/models/widget-catalog.model';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [...ALL_WIDGET_COMPONENTS, NgComponentOutlet, GenericWidgetCard, MapWidgetCard, Icon],
  templateUrl: './search-modal.html',
  styleUrl: './search-modal.scss',
  animations: [
    trigger('textFade', [
      transition('* => *', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class SearchModal {
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  private readonly http           = inject(HttpClient);
  private readonly baseUrl        = inject(API_BASE_URL);
  private readonly catalogService = inject(WidgetCatalogService);

  readonly isOpen      = input<boolean>(false);
  readonly searchQuery = input<string>('');
  readonly closed      = output<void>();

  readonly isClosing       = signal(false);
  readonly inputValue      = signal('');
  readonly submittedQuery  = signal('');
  readonly inputFocused    = signal(false);
  readonly isMicSpeaking   = signal(false);
  readonly isFrameExpanded = signal(false);
  readonly aiOverview      = signal<AiOverview | null>(null);

  private readonly catalogEntries = toSignal(
    this.catalogService.getAllVisibleWidgets(),
    {initialValue: [] as WidgetCatalogEntry[]},
  );

  readonly currentPage = signal(1);
  readonly ITEMS_PER_PAGE = 8;

  readonly allWidgetTypes = computed(() =>
    this.catalogEntries().map(e => e.id as WidgetType),
  );

  readonly visibleWidgetTypes = computed(() =>
    this.allWidgetTypes().filter(type => this.isWidgetVisible(type)),
  );

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.visibleWidgetTypes().length / this.ITEMS_PER_PAGE)),
  );

  readonly paginatedWidgetTypes = computed(() => {
    const start = (this.currentPage() - 1) * this.ITEMS_PER_PAGE;
    return this.visibleWidgetTypes().slice(start, start + this.ITEMS_PER_PAGE);
  });

  /**
   * Compact, windowed pagination: always shows page 1, the last page, and a
   * window of ±1 around the current page. Gaps are represented by `'...'`
   * which the template renders as a non-clickable ellipsis.
   */
  readonly pageNumbers = computed<(number | '...')[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({length: total}, (_, i) => i + 1);
    }

    const items: (number | '...')[] = [1];
    const windowStart = Math.max(2, current - 1);
    const windowEnd = Math.min(total - 1, current + 1);

    if (windowStart > 2) items.push('...');
    for (let i = windowStart; i <= windowEnd; i++) items.push(i);
    if (windowEnd < total - 1) items.push('...');

    items.push(total);
    return items;
  });

  /** Adaptive breakpoints: col 1 always gets up to 2 items, remainder splits evenly into col 2 & 3. */
  private readonly colBreakpoints = computed((): [number, number] => {
    const n    = this.paginatedWidgetTypes().length;
    const col1 = Math.min(2, n);
    const col2 = Math.ceil((n - col1) / 2);
    return [col1, col1 + col2];
  });

  readonly col1Types = computed(() => this.paginatedWidgetTypes().slice(0, this.colBreakpoints()[0]));
  readonly col2Types = computed(() => this.paginatedWidgetTypes().slice(this.colBreakpoints()[0], this.colBreakpoints()[1]));
  readonly col3Types = computed(() => this.paginatedWidgetTypes().slice(this.colBreakpoints()[1]));

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const query = this.searchQuery();
        this.inputValue.set(query);
        this.submittedQuery.set(query);
      }
    });

    // Reset to first page whenever search results change.
    effect(() => {
      this.submittedQuery();
      untracked(() => this.currentPage.set(1));
    });

    this.loadAiOverview();
  }

  private loadAiOverview(): void {
    this.http.get<AiOverviewResponse>(`${this.baseUrl}/ai-overview.json`).subscribe({
      next: (data) => this.aiOverview.set(data.aiOverview),
      error: (err) => console.error('Failed to load AI overview data:', err)
    });
  }

  readonly WidgetType = WidgetType;

  isCustomWidget(type: WidgetType): boolean {
    return type in WIDGET_COMPONENT_MAP;
  }

  getWidgetComponent(type: WidgetType): Type<unknown> {
    return WIDGET_COMPONENT_MAP[type]!;
  }

  getWidgetTitle(type: WidgetType): string {
    return this.catalogEntries().find(e => e.id === type)?.title ?? type;
  }

  isWidgetVisible(type: WidgetType): boolean {
    const search = this.submittedQuery().toLowerCase().trim();
    if (!search) return false;
    const entry = this.catalogEntries().find(e => e.id === type);
    const matchesTitle    = this.getWidgetTitle(type).toLowerCase().includes(search);
    const matchesCategory = entry?.category.some(c => c.toLowerCase().includes(search)) ?? false;
    return matchesTitle || matchesCategory;
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
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

  showPlaceholder(): boolean {
    return !this.inputFocused() && !this.inputValue();
  }

  onInputFocus(): void {
    this.inputFocused.set(true);
  }

  onInputBlur(): void {
    this.inputFocused.set(false);
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.inputValue.set(input.value);
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.submit();
    }
  }

  submit(): void {
    this.submittedQuery.set(this.inputValue());
  }

  toggleMic(): void {
    this.isMicSpeaking.update(v => !v);
  }

  toggleFrame(): void {
    this.isFrameExpanded.update(v => !v);
  }

  getHighlightedSummary(): string {
    const overview = this.aiOverview();
    if (!overview) return '';

    let text = overview.summary.text;
    for (const highlight of overview.summary.highlights) {
      text = text.replace(highlight, `<strong>${highlight}</strong>`);
    }
    return text;
  }
}
