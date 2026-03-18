import {Component, computed, effect, inject, input, output, signal, Type} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {NgComponentOutlet} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {ALL_WIDGET_COMPONENTS, WIDGET_COMPONENT_MAP} from '../widgets';
import {GenericWidgetCard} from '../../molecule/generic-widget-card/generic-widget-card';
import {WidgetType, WidgetStore} from '../../../core';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import type {SidebarPosition} from '../../../core';
import type {WidgetCatalogEntry} from '../../../core/models/widget-catalog.model';

@Component({
  selector: 'app-widget-center',
  standalone: true,
  imports: [...ALL_WIDGET_COMPONENTS, GenericWidgetCard, NgComponentOutlet, TranslateModule],
  templateUrl: './widget-center.html',
  styleUrl: './widget-center.scss'
})
export class WidgetCenter {
  private readonly widgetStore      = inject(WidgetStore);
  private readonly widgetCatalog    = inject(WidgetCatalogService);

  isOpen            = input<boolean>(false);
  targetSidebar     = input<SidebarPosition>('left');
  overrideSelection = input<WidgetType[] | null>(null);
  closed            = output<void>();
  widgetsAdded      = output<WidgetType[]>();

  isClosing      = signal(false);
  searchValue    = signal('');
  selectedWidgets = signal<Set<WidgetType>>(new Set());

  /** Catalog entries that have a sidebar component, from JSON. */
  private readonly sidebarEntries = toSignal(
    this.widgetCatalog.getSidebarWidgets(),
    {initialValue: [] as WidgetCatalogEntry[]},
  );

  /** Widget types to render in the grid — derived from the catalog. */
  readonly allWidgetTypes = computed(() =>
    this.sidebarEntries().map(e => e.id as WidgetType),
  );

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.initializeSelection();
      }
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
      this.selectedWidgets.set(new Set());
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

  isCustomWidget(type: WidgetType): boolean {
    return type in WIDGET_COMPONENT_MAP;
  }

  getWidgetComponent(type: WidgetType): Type<unknown> {
    return WIDGET_COMPONENT_MAP[type]!;
  }

  isVisible(type: WidgetType): boolean {
    const search = this.searchValue().toLowerCase().trim();
    if (!search) return true;
    const entry = this.sidebarEntries().find(e => e.id === type);
    const title = entry?.title ?? type;
    return title.toLowerCase().includes(search);
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
