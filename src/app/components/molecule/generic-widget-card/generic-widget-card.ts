import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {forkJoin} from 'rxjs';
import {WidgetCard} from '../widget-card/widget-card';
import {WidgetDetailConfigService} from '../../../core/services/widget-detail-config.service';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import {DashboardDataService} from '../../../core';
import {ChartBuilderService} from '../../../shared/services/chart-builder.service';
import type {ChartOptions} from '../../../shared/services/chart-config.service';
import type {ChartBuildContext, WidgetDetailData, WidgetDetailSeriesPoint} from '../../../core/models/widget-detail.model';
import type {ViewTypeConfig} from '../../../core/models/widget-detail-json.model';
import type {WidgetChartConfig} from '../../../core/models/widget-chart-config.model';

const MINI_CTX: ChartBuildContext = {
  forecastEnabled: false,
  forecastSeries: [],
  selectedCompareItems: [],
  relatedSVMap: {},
  forecastRelatedSVMap: {},
  showTooltip: false,
  showDataLabels: true,
};

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
  private readonly chartBuilderService  = inject(ChartBuilderService);

  widgetType     = input.required<string>();
  selected       = input(false);
  isCenter       = input(false);
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

  private widgetData    = signal<WidgetDetailData | null>(null);
  private widgetConfig  = signal<WidgetChartConfig | null>(null);

  ngOnInit(): void {
    forkJoin({
      configs:  this.configService.allConfigs$,
      catalog:  this.catalogService.getWidgetById(this.widgetType()),
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
      }

      config.loadData(this.dashboardDataService).subscribe(data => {
        this.widgetData.set(data);
        this.tableRows.set(data.series);
        this.unit.set(data.unit ?? '');
        this.updatedDate.set(data.updatedDate ?? '');
        const cfg = this.widgetConfig();
        if (cfg) {
          this.chartOptions.set(this.buildMini(cfg, data.series));
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

    this.chartOptions.set(this.buildMini({...config, type}, data.series));
  }

  private buildMini(config: WidgetChartConfig, series: WidgetDetailSeriesPoint[]): ChartOptions {
    const type = config.type;

    if (type === 'pie' || type === 'donut') {
      const built = this.chartBuilderService.build(config, series, MINI_CTX);
      return {
        ...built,
        chart: {...(built.chart ?? {}), height: this.isCenter() ? undefined : 112},
      };
    }

    return this.buildMiniCartesian(series, type as 'line' | 'column' | 'bar');
  }

  private buildMiniCartesian(series: WidgetDetailSeriesPoint[], chartType: 'line' | 'column' | 'bar'): ChartOptions {
    const isPercent = this.unit().includes('%');
    const values    = series.map(d => d.value);
    const years     = series.map(d => d.year);
    const isMillion = !isPercent && values.some(v => Math.abs(v) >= 100_000);

    const {yMin, yMax, tickInterval} = this.calcYAxis(values, isPercent, isMillion);
    const labelStyle = `color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 12px;`;
    const height     = this.isCenter() ? undefined : 112;

    const dlStyle = {
      fontFamily: "'Graphik Trial', sans-serif",
      fontWeight: '500',
      fontSize: '12px',
      color: '#3375C6',
      textOutline: 'none',
    };
    const dlFormat = isMillion
      ? {formatter: function(this: any) { return ((this.y as number) / 1_000_000).toFixed(1) + 'M'; }}
      : {format: isPercent ? '{y}%' : '{y}'};

    // Horizontal bars don't fit the mini card height — render bar as column
    const hcType = chartType === 'bar' ? 'column' : chartType;

    return {
      chart: {type: hcType, height, backgroundColor: 'transparent', spacing: [18, 10, 20, 0]},
      title: {text: ''},
      xAxis: {
        categories: years,
        labels: {enabled: true, y: 14, useHTML: true, formatter: function(this: any) { return `<span style="${labelStyle}">${this.value}</span>`; }},
        lineWidth: 0, tickWidth: 0, offset: 4,
      },
      yAxis: {
        min: yMin, max: yMax, tickInterval,
        title: {text: ''},
        labels: {
          enabled: true, y: 4, useHTML: true,
          formatter: isMillion
            ? function(this: any) { return `<span style="${labelStyle}">${((this.value as number) / 1_000_000).toFixed(1)}M</span>`; }
            : function(this: any) { return `<span style="${labelStyle}">${this.value}</span>`; },
        },
        gridLineColor: '#CFDCEC', gridLineWidth: 0.5,
      },
      legend: {enabled: false},
      tooltip: {enabled: false},
      credits: {enabled: false},
      plotOptions: {
        column: {borderRadius: 3, dataLabels: {enabled: true, ...dlFormat, style: dlStyle}},
        bar:    {borderRadius: 3, dataLabels: {enabled: true, ...dlFormat, style: dlStyle}},
        line: {
          marker: {enabled: true, symbol: 'circle', radius: 2.5, fillColor: '#3375C6', lineWidth: 0, lineColor: '#3375C6'},
          dataLabels: {enabled: true, ...dlFormat, style: {...dlStyle, lineHeight: '12px'}, verticalAlign: 'bottom', y: -2, overflow: 'allow', crop: false},
          states: {hover: {enabled: false}},
        },
      },
      series: [{type: hcType as any, color: '#3375C6', lineWidth: 2, data: values}],
    };
  }

  private calcYAxis(values: number[], isPercent: boolean, isMillion: boolean): {yMin: number; yMax: number; tickInterval: number} {
    if (values.length === 0) return {yMin: 0, yMax: 100, tickInterval: 25};
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (isMillion) {
      const step = 100_000;
      const yMin = Math.floor((min - step) / step) * step;
      const yMax = Math.ceil((max + step) / step) * step;
      return {yMin, yMax, tickInterval: Math.round((yMax - yMin) / 4 / step) * step || step};
    }
    const pad = isPercent ? 1 : Math.max(1, (max - min) * 0.1);
    const yMin = Math.floor(min - pad);
    const yMax = Math.ceil(max + pad);
    return {yMin, yMax, tickInterval: Math.max(1, Math.round((yMax - yMin) / 4))};
  }
}
