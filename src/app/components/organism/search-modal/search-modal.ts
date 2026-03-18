import {Component, computed, effect, ElementRef, inject, input, output, signal, Type, ViewChild} from '@angular/core';
import {NgComponentOutlet} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {animate, style, transition, trigger} from '@angular/animations';
import {HttpClient} from '@angular/common/http';
import {API_BASE_URL} from '../../../core/tokens/api-base-url.token';
import {WidgetType} from '../../../core';
import type {AiOverviewResponse, AiOverview} from '../../../core';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import {ALL_WIDGET_COMPONENTS, WIDGET_COMPONENT_MAP} from '../widgets';
import type {WidgetCatalogEntry} from '../../../core/models/widget-catalog.model';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [...ALL_WIDGET_COMPONENTS, NgComponentOutlet],
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
    this.catalogService.getSidebarWidgets(),
    {initialValue: [] as WidgetCatalogEntry[]},
  );

  readonly allWidgetTypes = computed(() =>
    this.catalogEntries().map(e => e.id as WidgetType),
  );

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const query = this.searchQuery();
        this.inputValue.set(query);
        this.submittedQuery.set(query);
      }
    });

    this.loadAiOverview();
  }

  private loadAiOverview(): void {
    this.http.get<AiOverviewResponse>(`${this.baseUrl}/ai-overview.json`).subscribe({
      next: (data) => this.aiOverview.set(data.aiOverview),
      error: (err) => console.error('Failed to load AI overview data:', err)
    });
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
    return this.getWidgetTitle(type).toLowerCase().includes(search);
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
