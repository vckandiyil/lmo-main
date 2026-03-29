import {Component, computed, effect, ElementRef, inject, input, OnDestroy, OnInit, signal, viewChild} from '@angular/core';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {Grid, grid as hcGrid} from '@highcharts/grid-lite';
import {Badge} from '../../atom/badge/badge';
import {Button} from '../../atom/button/button';
import {Icon} from '../../atom/icon/icon';
import {ChangeMetric} from '../../atom/change-metric/change-metric';
import {RangeSelector} from '../../atom/range-selector/range-selector';
import {BookmarkDropdown} from '../../molecule/bookmark-dropdown/bookmark-dropdown';
import {CompareDropdown, type CompareItem} from '../../molecule/compare-dropdown/compare-dropdown';
import {MetadataModal} from '../../molecule/metadata-modal/metadata-modal';
import {ChartWrapper} from '../../molecule/chart-wrapper/chart-wrapper';
import {ChartOptions} from '../../../shared/services/chart-config.service';
import {ChartBuilderService} from '../../../shared/services/chart-builder.service';
import {DashboardDataService, LanguageService, WidgetType} from '../../../core';
import {PresetService} from '../../../core/services/preset.service';
import {DOWNLOAD_FORMATS as DEFAULT_DOWNLOAD_FORMATS} from '../../../core/constants/download.constants';
import type {MetaDataItem, RelatedSVMap, ForecastRelatedSVMap} from '../../../core';
import type {ChartBuildContext, MultiSeriesItem, WidgetDetailConfig, WidgetDetailSeriesPoint} from '../../../core/models/widget-detail.model';

const COMPARE_COLORS = [
  '#E85D75', '#F59E0B', '#10B981', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
];

const DEFAULT_SETTINGS_TABS = [
  {id: 'download', icon: 'download-square', label: 'LMI.DOWNLOAD_TAB'},
  {id: 'settings', icon: 'settings', label: 'LMI.SETTINGS_TAB'},
  {id: 'notifications', icon: 'bell', label: 'LMI.NOTIFICATIONS_TAB'},
  {id: 'comments', icon: 'page-edit', label: 'LMI.COMMENTS_TAB'},
  {id: 'share', icon: 'share-android', label: 'LMI.SHARE_TAB'},
];


const DEFAULT_SHARE_FORMATS = [
  {id: 'telegram', label: 'Telegram', icon: 'telegram'},
  {id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp'},
  {id: 'viber', label: 'Viber', icon: 'viber'},
];

@Component({
  selector: 'app-widget-detail-template',
  standalone: true,
  imports: [Badge, Button, Icon, ChartWrapper, ChangeMetric, RangeSelector, BookmarkDropdown, CompareDropdown, MetadataModal, TranslateModule],
  templateUrl: './widget-detail-template.html',
  styleUrl: './widget-detail-template.scss',
})
export class WidgetDetailTemplate implements OnInit, OnDestroy {
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly chartBuilderService  = inject(ChartBuilderService);
  private readonly translate            = inject(TranslateService);
  private readonly languageService      = inject(LanguageService);
  private readonly presetService = inject(PresetService);

  protected readonly isArabic = this.languageService.isRtl;

  readonly config           = input<WidgetDetailConfig | null>(null);
  readonly initialChartType = input<string | null>(null);
  readonly widgetType       = input<WidgetType | null>(null);

  private readonly tableContainerRef = viewChild<ElementRef>('tableContainer');
  private gridInstance: Grid | null = null;
  private readonly tableRefreshTrigger = signal(0);

  constructor() {
    effect(() => {
      const containerRef = this.tableContainerRef();
      if (!containerRef) {
        if (this.gridInstance) {
          this.gridInstance.destroy();
          this.gridInstance = null;
        }
        return;
      }

      // Tracked signals — any change reruns the effect
      this.tableRefreshTrigger();
      const ms = this.getFilteredMultiSeries(); // tracks activeRange()

      let dtColumns: Record<string, (string | number | null)[]>;
      let gridColumns: {id: string; header: {format: string}; width?: number}[];

      if (ms.length > 1) {
        // Multi-series table: one column per series
        const allYears = new Set<string>();
        ms.forEach(s => s.data.forEach(p => allYears.add(p.year)));
        const sortedYears = [...allYears].sort();
        dtColumns = {year: sortedYears};
        ms.forEach(s => {
          const map = new Map(s.data.map(p => [p.year, p.value]));
          dtColumns[s.name] = sortedYears.map(y => map.get(y) ?? null);
        });
        gridColumns = [
          {id: 'year', header: {format: 'Year'}, width: 150},
          ...ms.map(s => ({id: s.name, header: {format: s.name}})),
        ];
      } else {
        // Single-series table
        const mainSeries    = this.getFilteredSeries();    // tracks activeRange()
        const isForecast    = this.forecastEnabled();
        const selected      = this.selectedSVIds();
        const selectedItems = this.compareItems().filter(i => selected.has(i.id));
        const valueLabel    = this.unit() || 'Value';

        const allYears = new Set<string>(mainSeries.map(p => p.year));
        const forecastData = isForecast ? this.rawForecastSeries : [];
        forecastData.forEach(p => allYears.add(p.year));
        selectedItems.forEach(item =>
          (this.relatedSVMap[item.id]?.data ?? []).forEach(p => allYears.add(p.YEAR)),
        );

        const sortedYears = [...allYears].sort();
        const mainMap     = new Map(mainSeries.map(p => [p.year, p.value]));
        const forecastMap = new Map(forecastData.map(p => [p.year, p.value]));

        dtColumns = {
          year:  sortedYears,
          value: sortedYears.map(y => mainMap.get(y) ?? null),
        };

        if (isForecast && forecastData.length > 0) {
          dtColumns['forecast'] = sortedYears.map(y => forecastMap.get(y) ?? null);
        }

        for (const item of selectedItems) {
          const svMap = new Map(
            (this.relatedSVMap[item.id]?.data ?? []).map(p => [p.YEAR, p.VALUE]),
          );
          dtColumns[item.id] = sortedYears.map(y => svMap.get(y) ?? null);
        }

        gridColumns = [
          {id: 'year', header: {format: 'Year'}, width: 150},
          {id: 'value', header: {format: valueLabel}},
          ...(isForecast && forecastData.length > 0
            ? [{id: 'forecast', header: {format: 'Forecast'}}]
            : []),
          ...selectedItems.map(item => ({id: item.id, header: {format: item.title}})),
        ];
      }

      if (this.gridInstance) {
        this.gridInstance.destroy();
        this.gridInstance = null;
      }

      this.gridInstance = hcGrid(containerRef.nativeElement, {
        accessibility: {enabled: false},
        rendering: {theme: ''},
        columnDefaults: {sorting: {enabled: false}},
        columns: gridColumns,
        dataTable: {columns: dtColumns},
      }) as Grid;
    });
  }

  private rawSeries: WidgetDetailSeriesPoint[] = [];
  private rawForecastSeries: WidgetDetailSeriesPoint[] = [];
  private rawMultiSeries: MultiSeriesItem[] = [];
  private relatedSVMap: RelatedSVMap = {};
  private forecastRelatedSVMap: ForecastRelatedSVMap = {};

  chartOptionsSignal = signal<ChartOptions>({});
  activeRange = signal<string>('ALL');
  activeSettingsTab = signal<string>('settings');
  activeChartType = signal<string>('line');

  title = signal('');
  description = signal('');
  securityLabel = signal('');
  unit = signal('');
  updatedDate = signal('');
  metaData = signal<MetaDataItem[]>([]);
  rangeOptions = signal<{ id: string; label: string; value: number | null }[]>([]);
  monthlyChange = signal<number>(0);
  quarterlyChange = signal<number>(0);
  yearlyChange = signal<number>(0);
  metadataModalOpen = signal<boolean>(false);
  highlights = signal<{ label: string; value: string }[]>([]);
  aiRecommendation = signal<{ badge?: string; badge_ar?: string; title: string; title_ar?: string; text: string; text_ar?: string; reason: string; reason_ar?: string } | undefined>(undefined);
  forecastEnabled = signal<boolean>(false);

  private readonly relatedSV = signal<{id: string; title: string}[]>([]);
  private readonly selectedSVIds = signal<Set<string>>(new Set());

  readonly compareItems = computed<CompareItem[]>(() => {
    const svList = this.relatedSV();
    const selected = this.selectedSVIds();
    return svList.map((sv, idx) => ({
      id: sv.id,
      title: sv.title,
      color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
      selected: selected.has(sv.id),
    }));
  });

  readonly hasForecast = computed(() => this.config()?.features?.forecast ?? false);
  readonly hasCompare  = computed(() => this.config()?.features?.compare  ?? false);

  termsAccepted = signal<boolean>(true);
  commentText = signal<string>('');
  editingCommentIndex = signal<number | null>(null);
  comments = signal<{ name: string; date: string; text: string }[]>([]);
  notificationEnabled1 = signal<boolean>(false);
  notificationEnabled2 = signal<boolean>(false);

  showTooltip = signal<boolean>(true);
  showDataLabels = signal<boolean>(true);
  showPreciseValue = signal<boolean>(false);

  /** Chart-type switcher icons — driven by viewTypes from widgets-detail-config.json */
  readonly chartTypes = computed(() => {
    const vt = this.config()?.viewTypes;
    if (vt?.length) return vt.map(v => ({id: v.id, icon: v.icon, label: v.label}));
    // Fallback when no config is loaded yet
    return [
      {id: 'line',  icon: 'graph-up',        label: 'Line Chart'},
      {id: 'bar',   icon: 'stats-up-square', label: 'Bar Chart'},
      {id: 'pie',   icon: 'chart-pie',       label: 'Pie Chart'},
      {id: 'table', icon: 'layout-left',     label: 'Table'},
    ];
  });

  private readonly _formattedUpdatedDate = computed(() => {
    const raw = this.updatedDate();
    if (!raw) return '';
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'});
  });

  readonly statisticalMetadata = computed<MetaDataItem[]>(() => {
    this.isArabic(); // track language changes
    const meta = this.metaData();
    const periodicity = meta.find(m => m.label === 'Available periodicity')?.value || '';
    const timeCoverage = periodicity ? `${periodicity} data` : '';
    return [
      {label: this.translate.instant('LMI.INDICATOR_NAME'), value: this.config()?.indicatorName ?? ''},
      {label: this.translate.instant('LMI.METRIC_UNIT'), value: this.unit()},
      {label: this.translate.instant('LMI.TIME_COVERAGE'), value: timeCoverage},
      {label: this.translate.instant('LMI.UPDATED_DATE'), value: this._formattedUpdatedDate()},
      {label: this.translate.instant('LMI.SOURCE'), value: 'SCAD'},
    ].filter(item => !!item.value);
  });

  readonly presetNames = computed(() => this.presetService.presetNames());
  readonly isBookmarked = computed(() => {
    const type = this.widgetType();
    if (!type) return false;
    return this.presetService.presets().some(p =>
      p.leftWidgets.includes(type) || p.rightWidgets.includes(type),
    );
  });

  readonly settingsTabs = computed(() => this.config()?.settingsTabs ?? DEFAULT_SETTINGS_TABS);
  readonly downloadFormats = computed(() => this.config()?.downloadFormats ?? DEFAULT_DOWNLOAD_FORMATS);
  readonly shareFormats = computed(() => this.config()?.shareFormats ?? DEFAULT_SHARE_FORMATS);
  readonly activeTab = computed(() => this.settingsTabs().find(tab => tab.id === this.activeSettingsTab()));

  ngOnDestroy(): void {
    if (this.gridInstance) {
      this.gridInstance.destroy();
      this.gridInstance = null;
    }
  }

  ngOnInit(): void {
    const cfg = this.config();
    if (!cfg) return;

    // Use the chart type selected on the mini card, or fall back to the config default
    const override     = this.initialChartType();
    const defaultType  = cfg.viewTypes?.find(v => v.default)?.id ?? cfg.viewTypes?.[0]?.id;
    const startingType = override ?? defaultType;
    if (startingType) this.activeChartType.set(startingType);

    cfg.loadData(this.dashboardDataService).subscribe({
      next: (data) => {
        this.title.set(data.title);
        this.description.set(data.description);
        this.securityLabel.set(data.securityLabel);
        this.unit.set(data.unit);
        this.updatedDate.set(data.updatedDate);
        this.metaData.set(data.metaData);
        this.rangeOptions.set(data.rangeOptions);
        this.monthlyChange.set(data.monthlyChange);
        this.quarterlyChange.set(data.quarterlyChange);
        this.yearlyChange.set(data.yearlyChange);
        this.highlights.set(data.highlights);
        this.aiRecommendation.set(data.aiRecommendation);
        this.activeRange.set(data.defaultRange);
        this.rawSeries = data.series;
        this.rawForecastSeries = data.forecastSeries ?? [];
        this.rawMultiSeries = data.multiSeries ?? [];
        this.relatedSV.set(data.relatedSV ?? []);
        this.relatedSVMap = data.relatedSVMap ?? {};
        this.forecastRelatedSVMap = data.forecastRelatedSVMap ?? {};
        this.rebuildChart();
      },
      error: (err) => {
        console.error('Failed to load widget detail data:', err);
      },
    });
  }

  addToPreset(presetName: string): void {
    const type = this.widgetType();
    if (!type) return;
    this.presetService.addWidgetToPreset(presetName, type);
  }

  setSettingsTab(tabId: string): void {
    this.activeSettingsTab.set(tabId);
  }

  setChartType(typeId: string): void {
    this.activeChartType.set(typeId);
    this.rebuildChart();
  }

  toggleForecast(): void {
    this.forecastEnabled.update(v => !v);
    this.rebuildChart();
  }

  toggleSV(id: string): void {
    let adding = false;
    this.selectedSVIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) { next.delete(id); }
      else { next.add(id); adding = true; }
      return next;
    });

    this.rebuildChart();
  }

  toggleTerms(): void {
    this.termsAccepted.update(v => !v);
  }

  setRange(range: string): void {
    this.activeRange.set(range);
    this.rebuildChart();
  }

  addComment(): void {
    const text = this.commentText().trim();
    if (!text) return;
    const editIndex = this.editingCommentIndex();
    if (editIndex !== null) {
      this.comments.update(list => list.map((c, i) => i === editIndex ? {...c, text} : c));
      this.editingCommentIndex.set(null);
    } else {
      const date = new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
      this.comments.update(list => [...list, {name: 'Name Surname', date, text}]);
    }
    this.commentText.set('');
  }

  editComment(index: number): void {
    this.editingCommentIndex.set(index);
    this.commentText.set(this.comments()[index].text);
  }

  removeComment(index: number): void {
    this.comments.update(list => list.filter((_, i) => i !== index));
    if (this.editingCommentIndex() === index) {
      this.editingCommentIndex.set(null);
      this.commentText.set('');
    }
  }

  cancelComment(): void {
    this.commentText.set('');
    this.editingCommentIndex.set(null);
  }

  toggleNotification1(): void {
    this.notificationEnabled1.update(v => !v);
  }

  toggleNotification2(): void {
    this.notificationEnabled2.update(v => !v);
  }

  toggleTooltip(): void {
    this.showTooltip.update(v => !v);
    this.rebuildChart();
  }

  toggleDataLabels(): void {
    this.showDataLabels.update(v => !v);
    this.rebuildChart();
  }

  togglePreciseValue(): void {
    this.showPreciseValue.update(v => !v);
    this.rebuildChart();
  }

  private rebuildChart(): void {
    this.tableRefreshTrigger.update(v => v + 1);
    const cfg = this.config();
    if (!cfg?.chartConfig || this.activeChartType() === 'table') return;
    // 'bar' view type means vertical bars (column in Highcharts); horizontal = 'bar' in Highcharts
    const activeType = this.activeChartType();
    const chartType = activeType === 'bar' ? 'column' : activeType;
    const effectiveConfig = {...cfg.chartConfig, type: chartType};
    this.chartOptionsSignal.set(
      this.chartBuilderService.build(effectiveConfig, this.getFilteredSeries(), this.buildContext()),
    );
  }

  private buildContext(): ChartBuildContext {
    const selected = this.selectedSVIds();
    return {
      forecastEnabled: this.forecastEnabled(),
      forecastSeries: this.rawForecastSeries,
      selectedCompareItems: this.compareItems().filter(i => selected.has(i.id)),
      relatedSVMap: this.relatedSVMap,
      forecastRelatedSVMap: this.forecastRelatedSVMap,
      showTooltip: this.showTooltip(),
      showDataLabels: this.showDataLabels(),
      showPreciseValue: this.showPreciseValue(),
      multiSeries: this.rawMultiSeries.length ? this.getFilteredMultiSeries() : undefined,
    };
  }

  private getFilteredSeries(): WidgetDetailSeriesPoint[] {
    const range = this.activeRange();
    if (range === 'ALL') return this.rawSeries;
    const years = parseInt(range, 10);
    return this.rawSeries.slice(-years);
  }

  private getFilteredMultiSeries(): MultiSeriesItem[] {
    const range = this.activeRange();
    if (range === 'ALL') return this.rawMultiSeries;
    const years = parseInt(range, 10);
    return this.rawMultiSeries.map(s => ({...s, data: s.data.slice(-years)}));
  }
}
