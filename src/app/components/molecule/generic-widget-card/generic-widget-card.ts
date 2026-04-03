import {Component, effect, inject, input, OnInit, output, signal, untracked} from '@angular/core';
import {forkJoin} from 'rxjs';
import {WidgetCard} from '../widget-card/widget-card';
import {WidgetDetailConfigService} from '../../../core/services/widget-detail-config.service';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import {DashboardDataService} from '../../../core';
import {MiniChartBuilderService} from '../../../shared/services/mini-chart-builder.service';
import {ThemeService} from '../../../core/services/theme.service';
import type {ChartOptions} from '../../../shared/services/chart-config.service';
import type {MultiSeriesItem, WidgetDetailData, WidgetDetailSeriesPoint} from '../../../core/models/widget-detail.model';
import type {ViewTypeConfig} from '../../../core/models/widget-detail-json.model';
import type {WidgetChartConfig} from '../../../core/models/widget-chart-config.model';

@Component({
  selector: 'app-generic-widget-card',
  standalone: true,
  imports: [WidgetCard],
  template: `
    <app-widget-card
      [title]="title()"
      [chartOptions]="chartOptions()"
      [selected]="selected()"
      [widgetType]="widgetType()"
      [icons]="icons()"
      [isCenter]="isCenter()"
      [indicatorName]="indicatorName()"
      [unit]="unit()"
      [updatedDate]="updatedDate()"
      [periodicity]="periodicity()"
      [viewTypes]="viewTypes()"
      [activeChartType]="activeChartType()"
      [tableRows]="tableRows()"
      (selectedChange)="selectedChange.emit()"
      (expandClick)="expandClick.emit()"
      (chartTypeChange)="onChartTypeChange($event)"
    />
  `,
})
export class GenericWidgetCard implements OnInit {
  private readonly configService        = inject(WidgetDetailConfigService);
  private readonly catalogService       = inject(WidgetCatalogService);
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly miniChartBuilder     = inject(MiniChartBuilderService);
  private readonly themeService         = inject(ThemeService);

  widgetType      = input.required<string>();
  selected        = input(false);
  isCenter        = input(false);
  selectedChange  = output<void>();
  expandClick     = output<void>();
  chartTypeSelect = output<string>();

  title           = signal('');
  chartOptions    = signal<ChartOptions>({});
  icons           = signal<string[]>(['stars', 'stats-up-square', 'more']);
  indicatorName   = signal('');
  unit            = signal('');
  updatedDate     = signal('');
  periodicity     = signal('');
  viewTypes       = signal<ViewTypeConfig[]>([]);
  activeChartType = signal<string>('line');
  tableRows       = signal<WidgetDetailSeriesPoint[]>([]);

  private widgetData   = signal<WidgetDetailData | null>(null);
  private widgetConfig = signal<WidgetChartConfig | null>(null);
  private multiSeries  = signal<MultiSeriesItem[] | undefined>(undefined);

  constructor() {
    // Rebuild the mini chart whenever the theme changes so colors stay correct.
    effect(() => {
      this.themeService.isDarkMode(); // only this is tracked
      untracked(() => {
        const data = this.widgetData();
        const cfg  = this.widgetConfig();
        if (!data || !cfg) return;
        this.chartOptions.set(this.buildMini(cfg, data.series, data.multiSeries));
      });
    });
  }

  ngOnInit(): void {
    forkJoin({
      configs: this.configService.allConfigs$,
      catalog: this.catalogService.getWidgetById(this.widgetType()),
    }).subscribe(({configs, catalog}) => {
      const config = configs.configMap.get(this.widgetType());
      if (!config) return;

      this.title.set(catalog?.title ?? this.widgetType());
      this.indicatorName.set(config.indicatorName ?? '');
      if (catalog?.hasExpandIcon) {
        this.icons.set(['stars', 'stats-up-square', 'expand', 'more']);
      }
      if (config.viewTypes?.length) {
        this.viewTypes.set(config.viewTypes);
      }
      if (config.chartConfig) {
        this.widgetConfig.set(config.chartConfig);
        // Initialize active chart type from config; 'bar' renders as 'column' in mini cards
        const configType = config.chartConfig.type;
        this.activeChartType.set(configType === 'bar' ? 'column' : configType);
      }

      config.loadData(this.dashboardDataService).subscribe(data => {
        this.widgetData.set(data);
        this.tableRows.set(data.series);
        this.unit.set(data.unit ?? '');
        this.updatedDate.set(data.updatedDate ?? '');
        this.multiSeries.set(data.multiSeries);

        const cfg = this.widgetConfig();
        if (cfg) {
          this.chartOptions.set(this.buildMini(cfg, data.series, data.multiSeries));
        }

        const p = (data.metaData ?? []).find(m => m.label === 'Available periodicity')?.value ?? '';
        this.periodicity.set(p);
      });
    });
  }

  onChartTypeChange(type: string): void {
    if (type === this.activeChartType()) return;
    this.activeChartType.set(type);
    this.chartTypeSelect.emit(type);
    if (type === 'table') return;

    const data   = this.widgetData();
    const config = this.widgetConfig();
    if (!data || !config) return;

    this.chartOptions.set(this.buildMini({...config, type}, data.series, this.multiSeries()));
  }

  private buildMini(
    config: WidgetChartConfig,
    series: WidgetDetailSeriesPoint[],
    multiSeries?: MultiSeriesItem[],
  ): ChartOptions {
    return this.miniChartBuilder.build(config, series, multiSeries, this.unit(), this.isCenter());
  }
}
