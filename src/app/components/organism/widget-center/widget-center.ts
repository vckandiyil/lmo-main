import {Component, computed, effect, inject, input, output, signal, Type, untracked} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {NgComponentOutlet} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {ALL_WIDGET_COMPONENTS, WIDGET_COMPONENT_MAP} from '../widgets';
import {GenericWidgetCard} from '../../molecule/generic-widget-card/generic-widget-card';
import {MapWidgetCard} from '../../molecule/map-widget-card/map-widget-card';
import {Dropdown} from '../../atom/dropdown/dropdown';
import {Icon} from '../../atom/icon/icon';
import {WidgetType, WidgetStore} from '../../../core';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import type {SidebarPosition} from '../../../core';
import type {WidgetCatalogEntry} from '../../../core/models/widget-catalog.model';

@Component({
  selector: 'app-widget-center',
  standalone: true,
  imports: [...ALL_WIDGET_COMPONENTS, GenericWidgetCard, MapWidgetCard, NgComponentOutlet, TranslateModule, Dropdown, Icon],
  templateUrl: './widget-center.html',
  styleUrl: './widget-center.scss'
})
export class WidgetCenter {
  private readonly widgetStore   = inject(WidgetStore);
  private readonly widgetCatalog = inject(WidgetCatalogService);

  isOpen            = input<boolean>(false);
  targetSidebar     = input<SidebarPosition>('left');
  overrideSelection = input<WidgetType[] | null>(null);
  closed            = output<void>();
  widgetsAdded      = output<WidgetType[]>();

  readonly WidgetType = WidgetType;

  isClosing       = signal(false);
  searchValue     = signal('');
  selectedWidgets = signal<Set<WidgetType>>(new Set());
  selectedTopic   = signal<string | null>(null);
  currentPage     = signal(1);

  readonly ITEMS_PER_PAGE = 8;

  /** Catalog entries that have a sidebar component, from JSON. */
  private readonly sidebarEntries = toSignal(
    this.widgetCatalog.getSidebarWidgets(),
    {initialValue: [] as WidgetCatalogEntry[]},
  );

  /** Available topic names from the catalog. */
  readonly topics = toSignal(
    this.widgetCatalog.getTopics(),
    {initialValue: [] as string[]},
  );

  /** Entries filtered by selected topic and search query. */
  private readonly filteredEntries = computed(() => {
    const topic  = this.selectedTopic();
    const search = this.searchValue().toLowerCase().trim();
    return this.sidebarEntries().filter(e => {
      if (search) {
        const matchesTitle    = e.title.toLowerCase().includes(search);
        const matchesCategory = e.category.some(c => c.toLowerCase().includes(search));
        return matchesTitle || matchesCategory;
      }
      return !topic || e.category.includes(topic);
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredEntries().length / this.ITEMS_PER_PAGE)),
  );

  readonly paginatedWidgetTypes = computed(() => {
    const start = (this.currentPage() - 1) * this.ITEMS_PER_PAGE;
    return this.filteredEntries()
      .slice(start, start + this.ITEMS_PER_PAGE)
      .map(e => e.id as WidgetType);
  });

  readonly pageNumbers = computed(() =>
    Array.from({length: this.totalPages()}, (_, i) => i + 1),
  );

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
        this.initializeSelection();
      }
    });

    // Reset to first page whenever topic or search changes.
    effect(() => {
      this.selectedTopic();
      this.searchValue();
      untracked(() => this.currentPage.set(1));
    });
  }

  private initializeSelection(): void {
    const override = this.overrideSelection();
    if (override !== null) {
      this.selectedWidgets.set(new Set(override));
      return;
    }
    const targetWidgets = this.targetSidebar() === 'left'
      ? this.widgetStore.leftWidgets()
      : this.widgetStore.rightWidgets();
    this.selectedWidgets.set(new Set(targetWidgets.map(w => w.type)));
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  close(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      this.isClosing.set(false);
      this.selectedWidgets.set(new Set());
      this.selectedTopic.set(null);
      this.currentPage.set(1);
      this.closed.emit();
    }, 300);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchValue.set(input.value);
  }

  clearSearch(): void {
    this.searchValue.set('');
  }

  onTopicSelect(topic: string): void {
    this.selectedTopic.set(topic);
  }

  clearTopic(): void {
    this.selectedTopic.set(null);
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

  isCustomWidget(type: WidgetType): boolean {
    return type in WIDGET_COMPONENT_MAP;
  }

  getWidgetComponent(type: WidgetType): Type<unknown> {
    return WIDGET_COMPONENT_MAP[type]!;
  }

  isSelected(type: WidgetType): boolean {
    return this.selectedWidgets().has(type);
  }

  toggleSelection(type: WidgetType): void {
    this.selectedWidgets.update(set => {
      const newSet = new Set(set);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  }

  addSelectedWidgets(): void {
    this.widgetsAdded.emit(Array.from(this.selectedWidgets()));
    this.close();
  }
}
