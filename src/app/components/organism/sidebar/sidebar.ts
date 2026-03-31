import {AfterViewInit, Component, computed, DestroyRef, effect, ElementRef, inject, Input, OnDestroy, signal, untracked, ViewChild, OnInit} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {CdkDragDrop, CdkDrag, CdkDropList, CdkDragPlaceholder} from '@angular/cdk/drag-drop';
import {Icon} from '../../atom/icon/icon';
import {WIDGET_COMPONENT_MAP} from '../widgets';
import {GenericWidgetCard} from '../../molecule/generic-widget-card/generic-widget-card';
import {DynamicWidget} from '../dynamic-widget/dynamic-widget';
import {WidgetCenter} from '../widget-center/widget-center';
import {WidgetDetailModal} from '../widget-detail-modal/widget-detail-modal';
import {Recommendations} from '../../molecule/recommendations/recommendations';
import {MapWidgetCard} from '../../molecule/map-widget-card/map-widget-card';
import {WidgetStore, WidgetType, ThemeService, WidgetDetailService, LayoutService} from '../../../core';
import {createWidgetId} from '../../../core/models/widget.model';
import type {Widget, SidebarPosition} from '../../../core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    Icon,
    GenericWidgetCard,
    WidgetCenter,
    WidgetDetailModal,
    Recommendations,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    DynamicWidget,
    MapWidgetCard,
    TranslateModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('leftWidgets') leftWidgets!: ElementRef<HTMLElement>;
  @ViewChild('rightWidgets') rightWidgets!: ElementRef<HTMLElement>;

  @ViewChild('col1Container') col1Container?: ElementRef<HTMLElement>;
  @ViewChild('col2Container') col2Container?: ElementRef<HTMLElement>;
  @ViewChild('col3Container') col3Container?: ElementRef<HTMLElement>;
  @ViewChild('col4Container') col4Container?: ElementRef<HTMLElement>;

  private readonly scrollAmount = 200;
  private readonly widgetStore = inject(WidgetStore);
  private readonly themeService = inject(ThemeService);
  private readonly widgetDetailService = inject(WidgetDetailService);
  private readonly layoutService = inject(LayoutService);
  private readonly mobileQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 767.98px)') : null;
  private readonly mobileListener = (e: MediaQueryListEvent) => this.isMobile.set(e.matches);

  isDarkMode = this.themeService.isDarkMode;
  readonly layoutMode = this.layoutService.layoutMode;
  readonly isMobile = signal(this.mobileQuery?.matches ?? false);

  leftWidgetList = this.widgetStore.leftWidgets;
  rightWidgetList = this.widgetStore.rightWidgets;

  // Independent per-column signals for 4col mode (stable, not re-split on every change)
  readonly col1Widgets = signal<Widget[]>([]);
  readonly col2Widgets = signal<Widget[]>([]);
  readonly col3Widgets = signal<Widget[]>([]);
  readonly col4Widgets = signal<Widget[]>([]);

  readonly WidgetType = WidgetType;

  canScrollUpLeft = signal(false);
  canScrollDownLeft = signal(true);
  canScrollUpRight = signal(false);
  canScrollDownRight = signal(true);

  canScrollUp4 = signal<Record<number, boolean>>({1: false, 2: false, 3: false, 4: false});
  canScrollDown4 = signal<Record<number, boolean>>({1: true, 2: true, 3: true, 4: true});

  @Input() showRecommendations = true;
  @Input() resetToDefaults = true;

  isWidgetCenterOpen = signal(false);
  activeWidgetCenterSidebar = signal<SidebarPosition>('left');
  private activeCol4 = signal<1 | 2 | 3 | 4 | null>(null);
  private splitNextAdd = signal(false);

  readonly col4OverrideSelection = computed<WidgetType[] | null>(() => {
    const col = this.activeCol4();
    if (col === null) return null;
    return this.getColSignal(col)().map(w => w.type);
  });

  activeDetailWidget = this.widgetDetailService.activeDetailWidget;
  private wasDragged = false;

  constructor() {
    this.mobileQuery?.addEventListener('change', this.mobileListener);

    // Initialize the 4 column signals from the store when entering 4col mode.
    // untracked() ensures the effect only re-runs on layoutMode changes,
    // not on every store update (which would reset in-progress drag operations).
    effect(() => {
      if (this.layoutMode() === '4col') {
        const left  = untracked(() => this.leftWidgetList());
        const right = untracked(() => this.rightWidgetList());
        const leftMid  = Math.ceil(left.length / 2);
        const rightMid = Math.ceil(right.length / 2);
        this.col1Widgets.set(left.slice(0, leftMid));
        this.col2Widgets.set(left.slice(leftMid));
        this.col3Widgets.set(right.slice(0, rightMid));
        this.col4Widgets.set(right.slice(rightMid));
        setTimeout(() => this.setup4ColScrollListeners(), 0);
      }
    });
  }

  private getColSignal(col: 1 | 2 | 3 | 4) {
    if (col === 1) return this.col1Widgets;
    if (col === 2) return this.col2Widgets;
    if (col === 3) return this.col3Widgets;
    return this.col4Widgets;
  }

  private syncColsToStore(): void {
    const left  = [...this.col1Widgets(), ...this.col2Widgets()];
    const right = [...this.col3Widgets(), ...this.col4Widgets()];
    this.widgetStore.setFourColLayout(left, right);
  }

  isCustomWidget(type: WidgetType): boolean {
    return type in WIDGET_COMPONENT_MAP;
  }

  openWidgetCenter(sidebar: SidebarPosition): void {
    this.splitNextAdd.set(false);
    this.activeCol4.set(null);
    this.activeWidgetCenterSidebar.set(sidebar);
    this.isWidgetCenterOpen.set(true);
  }

  openWidgetCenterSplitEvenly(): void {
    this.splitNextAdd.set(true);
    this.activeCol4.set(null);
    this.activeWidgetCenterSidebar.set('left');
    this.isWidgetCenterOpen.set(true);
  }

  openWidgetCenter4Col(col: 1 | 2 | 3 | 4): void {
    this.activeCol4.set(col);
    this.activeWidgetCenterSidebar.set(col <= 2 ? 'left' : 'right');
    this.isWidgetCenterOpen.set(true);
  }

  closeWidgetCenter(): void {
    this.isWidgetCenterOpen.set(false);
  }

  onWidgetsAdded(widgetTypes: WidgetType[]): void {
    const col = this.activeCol4();
    if (this.layoutMode() === '4col' && col !== null) {
      this.onWidgetsAdded4Col(col, widgetTypes);
    } else if (this.splitNextAdd()) {
      this.splitNextAdd.set(false);
      const mid = Math.ceil(widgetTypes.length / 2);
      this.widgetStore.setTopicLayout(widgetTypes.slice(0, mid), widgetTypes.slice(mid));
    } else {
      this.widgetStore.setWidgets(this.activeWidgetCenterSidebar(), widgetTypes);
    }
  }

  private onWidgetsAdded4Col(col: 1 | 2 | 3 | 4, widgetTypes: WidgetType[]): void {
    const colSignal = this.getColSignal(col);
    const existingMap = new Map(colSignal().map(w => [w.type, w]));
    const newWidgets = widgetTypes.map(type => existingMap.get(type) ?? {id: createWidgetId(type), type});
    colSignal.set(newWidgets);

    // Remove widgets now in this col from all other cols (no duplicates)
    const selectedSet = new Set(widgetTypes);
    ([1, 2, 3, 4] as const).forEach(otherCol => {
      if (otherCol === col) return;
      this.getColSignal(otherCol).update(list => list.filter(w => !selectedSet.has(w.type)));
    });

    this.syncColsToStore();
  }

  onDragStarted(): void {
    this.wasDragged = true;
  }

  onWidgetClick(type: WidgetType): void {
    if (this.wasDragged) {
      this.wasDragged = false;
      return;
    }
    if (type === WidgetType.RegionProfile || type === WidgetType.Map) {
      return;
    }
    this.widgetDetailService.open(type);
  }

  closeWidgetDetail(): void {
    this.widgetDetailService.close();
  }

  onWidgetChartTypeChange(widgetType: WidgetType, chartType: string): void {
    this.widgetDetailService.setChartTypeOverride(widgetType, chartType);
  }

  onWidgetExpand(sidebar: SidebarPosition, index: number, type?: WidgetType): void {
    this.widgetStore.swapWithCenter(sidebar, index);
  }

  ngOnInit(): void {
    if (this.resetToDefaults) {
      this.widgetStore.resetToDefaults();
    }
  }

  ngOnDestroy(): void {
    this.mobileQuery?.removeEventListener('change', this.mobileListener);
  }

  ngAfterViewInit(): void {
    if (this.leftWidgets) {
      this.setupScrollListener(this.leftWidgets.nativeElement, 'left');
      this.updateScrollState(this.leftWidgets.nativeElement, 'left');
    }
    if (this.rightWidgets) {
      this.setupScrollListener(this.rightWidgets.nativeElement, 'right');
      this.updateScrollState(this.rightWidgets.nativeElement, 'right');
    }
  }

  private setupScrollListener(element: HTMLElement, sidebar: 'left' | 'right'): void {
    element.addEventListener('scroll', () => this.updateScrollState(element, sidebar));
  }

  private updateScrollState(element: HTMLElement, sidebar: 'left' | 'right'): void {
    const canUp   = element.scrollTop > 0;
    const canDown = element.scrollTop + element.clientHeight < element.scrollHeight - 1;

    if (sidebar === 'left') {
      this.canScrollUpLeft.set(canUp);
      this.canScrollDownLeft.set(canDown);
    } else {
      this.canScrollUpRight.set(canUp);
      this.canScrollDownRight.set(canDown);
    }
  }

  scrollUp(sidebar: 'left' | 'right'): void {
    const container = sidebar === 'left' ? this.leftWidgets : this.rightWidgets;
    container.nativeElement.scrollBy({top: -this.scrollAmount, behavior: 'smooth'});
  }

  scrollDown(sidebar: 'left' | 'right'): void {
    const container = sidebar === 'left' ? this.leftWidgets : this.rightWidgets;
    container.nativeElement.scrollBy({top: this.scrollAmount, behavior: 'smooth'});
  }

  private setup4ColScrollListeners(): void {
    const refs: [ElementRef<HTMLElement> | undefined, number][] = [
      [this.col1Container, 1],
      [this.col2Container, 2],
      [this.col3Container, 3],
      [this.col4Container, 4],
    ];
    for (const [ref, col] of refs) {
      if (ref?.nativeElement) {
        this.update4ColScrollState(ref.nativeElement, col);
        ref.nativeElement.addEventListener('scroll', () => this.update4ColScrollState(ref.nativeElement!, col));
      }
    }
  }

  private update4ColScrollState(el: HTMLElement, col: number): void {
    this.canScrollUp4.update(s => ({...s, [col]: el.scrollTop > 0}));
    this.canScrollDown4.update(s => ({...s, [col]: el.scrollTop + el.clientHeight < el.scrollHeight - 1}));
  }

  scrollUp4Col(col: number): void {
    const refs = [, this.col1Container, this.col2Container, this.col3Container, this.col4Container];
    refs[col]?.nativeElement.scrollBy({top: -this.scrollAmount, behavior: 'smooth'});
  }

  scrollDown4Col(col: number): void {
    const refs = [, this.col1Container, this.col2Container, this.col3Container, this.col4Container];
    refs[col]?.nativeElement.scrollBy({top: this.scrollAmount, behavior: 'smooth'});
  }

  onWidgetDrop4Col(event: CdkDragDrop<Widget[]>, targetCol: 1 | 2 | 3 | 4): void {
    const sourceColStr = event.previousContainer.id;
    const sourceCol = parseInt(sourceColStr.replace('col', '').replace('-widgets', ''), 10) as 1 | 2 | 3 | 4;

    const sourceSignal = this.getColSignal(sourceCol);
    const targetSignal = this.getColSignal(targetCol);

    if (sourceCol === targetCol) {
      const items = [...sourceSignal()];
      const [removed] = items.splice(event.previousIndex, 1);
      items.splice(event.currentIndex, 0, removed);
      sourceSignal.set(items);
    } else {
      const sourceItems = [...sourceSignal()];
      const targetItems = [...targetSignal()];
      const [removed] = sourceItems.splice(event.previousIndex, 1);
      targetItems.splice(event.currentIndex, 0, removed);
      sourceSignal.set(sourceItems);
      targetSignal.set(targetItems);
    }

    this.syncColsToStore();
  }

  /**
   * Handle widget drop event from CDK drag and drop.
   * Handles both reordering within a sidebar and moving between sidebars.
   */
  onWidgetDrop(event: CdkDragDrop<Widget[]>, targetSidebar: SidebarPosition): void {
    const sourceSidebar: SidebarPosition = event.previousContainer.id === 'left-widgets' ? 'left' : 'right';

    if (event.previousContainer === event.container) {
      this.widgetStore.reorderWidgets(targetSidebar, event.previousIndex, event.currentIndex);
    } else {
      this.widgetStore.moveWidget(sourceSidebar, targetSidebar, event.previousIndex, event.currentIndex);
    }
  }
}
