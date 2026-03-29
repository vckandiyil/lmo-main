import {Component, effect, inject, input, OnInit, output, signal, untracked} from '@angular/core';
import {forkJoin} from 'rxjs';
import {WidgetCard} from '../widget-card/widget-card';
import {WidgetDetailConfigService} from '../../../core/services/widget-detail-config.service';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import {DashboardDataService} from '../../../core';
import {ChartBuilderService} from '../../../shared/services/chart-builder.service';
import type {ChartOptions} from '../../../shared/services/chart-config.service';
import type {ChartBuildContext, MultiSeriesItem, WidgetDetailData, WidgetDetailSeriesPoint} from '../../../core/models/widget-detail.model';
import type {ViewTypeConfig} from '../../../core/models/widget-detail-json.model';
import type {WidgetChartConfig} from '../../../core/models/widget-chart-config.model';
import {ThemeService} from '../../../core/services/theme.service';

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
  private readonly themeService         = inject(ThemeService);

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
  private multiSeries   = signal<MultiSeriesItem[] | undefined>(undefined);

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

  private buildMini(config: WidgetChartConfig, series: WidgetDetailSeriesPoint[], ms?: MultiSeriesItem[]): ChartOptions {
    const type = config.type;

    if (type === 'stacked-bar' && ms?.length) {
      return this.buildMiniStackedBar(ms, config.orientation === 'horizontal');
    }

    if (type === 'grouped-column' && ms?.length) {
      return this.buildMiniGroupedColumn(ms);
    }

    if (type === 'pie' || type === 'donut') {
      const built = this.chartBuilderService.build(config, series, MINI_CTX);
      return {
        ...built,
        chart: {...(built.chart ?? {}), height: this.isCenter() ? undefined : 112},
      };
    }

    return this.buildMiniCartesian(series, type as 'line' | 'column' | 'bar');
  }

  private buildMiniStackedBar(ms: MultiSeriesItem[], horizontal = false): ChartOptions {
    const isDark     = this.themeService.isDarkMode();
    const hcType     = horizontal ? 'bar' : 'column';
    const height     = this.isCenter() ? undefined : 112;
    const labelStyle = `color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 12px;`;
    const categories = ms[0].data.map(d => d.year);

    const tooltipBg   = isDark ? '#1E2937' : '#FFFFFF';
    const tooltipText = isDark ? '#FFFFFF'  : '#1E2937';
    const gridColor   = '#CFDCEC'; // matches all other mini charts in both themes

    const miniTooltip = {
      enabled: true,
      useHTML: true,
      hideDelay: 0,
      outside: true,
      backgroundColor: tooltipBg,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? undefined : '#E0E0E0',
      borderRadius: 6,
      shadow: false,
      formatter: function(this: any): string {
        const abs = Math.abs(this.y);
        const val = abs >= 1_000_000
          ? `${+(this.y / 1_000_000).toFixed(1)}M`
          : abs >= 1_000
          ? `${+(this.y / 1_000).toFixed(0)}K`
          : Number(this.y).toLocaleString('en-US');
        return `<span style="font-family: 'Graphik Trial', sans-serif; font-size: 12px; color: ${tooltipText};">` +
          `<span style="color: ${this.color};">&#9679;</span> ${this.series.name}: <b>${val}</b></span>`;
      },
    };

    if (horizontal) {
      return {
        colors: ms.map(s => s.color),
        chart: {type: 'bar', height, backgroundColor: 'transparent', spacing: [8, 20, 8, 0], marginLeft: 52},
        title: {text: ''},
        xAxis: {
          categories,
          labels: {enabled: true, style: {color: 'var(--lmo-text-category)', fontFamily: "'Graphik Trial', sans-serif", fontWeight: '400', fontSize: '12px'}},
          lineWidth: 0, tickWidth: 0,
        },
        yAxis: {
          title: {text: ''},
          labels: {enabled: false},
          gridLineWidth: 1,
          gridLineColor: gridColor,
        },
        legend: {enabled: false},
        tooltip: miniTooltip,
        credits: {enabled: false},
        plotOptions: {
          bar: {stacking: 'normal', borderWidth: 0, borderRadius: 0},
        },
        series: ms.map(s => ({type: 'bar' as const, name: s.name, color: s.color, data: s.data.map(d => d.value)})),
      };
    }

    return {
      colors: ms.map(s => s.color),
      chart: {type: 'column', height, backgroundColor: 'transparent', spacing: [18, 10, 20, 0]},
      title: {text: ''},
      xAxis: {
        categories,
        labels: {enabled: true, y: 14, useHTML: true, formatter: function(this: any) { return `<span style="${labelStyle}">${this.value}</span>`; }},
        lineWidth: 0, tickWidth: 0, offset: 4,
      },
      yAxis: {
        title: {text: ''},
        labels: {
          enabled: true, y: 4, useHTML: true,
          formatter: function(this: any) { return `<span style="${labelStyle}">${((this.value as number) / 1_000_000).toFixed(1)}M</span>`; },
        },
        gridLineColor: '#CFDCEC', gridLineWidth: 0.5,
      },
      legend: {enabled: false},
      tooltip: miniTooltip,
      credits: {enabled: false},
      plotOptions: {
        column: {stacking: 'normal', borderWidth: 0, borderRadius: 0},
      },
      series: ms.map(s => ({type: 'column' as const, name: s.name, color: s.color, data: s.data.map(d => d.value)})),
    };
  }

  private buildMiniGroupedColumn(ms: MultiSeriesItem[]): ChartOptions {
    const height      = this.isCenter() ? undefined : 112;
    const labelStyle  = `color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 12px;`;
    const lastIndex   = ms[0].data.length - 1;
    const lastYear    = ms[0].data[lastIndex]?.year ?? '';

    return {
      colors: ms.map(s => s.color),
      chart: {type: 'column', height, backgroundColor: 'transparent', spacing: [18, 10, 20, 0]},
      title: {text: ''},
      xAxis: {
        categories: [lastYear],
        labels: {enabled: true, y: 14, useHTML: true, formatter: function(this: any) { return `<span style="${labelStyle}">${this.value}</span>`; }},
        lineWidth: 0, tickWidth: 0, offset: 4,
      },
      yAxis: {
        title: {text: ''},
        labels: {enabled: false},
        gridLineColor: '#CFDCEC',
        gridLineWidth: 0.5,
      },
      legend: {enabled: false},
      tooltip: {enabled: false},
      credits: {enabled: false},
      plotOptions: {
        column: {grouping: true, borderWidth: 0, borderRadius: 0},
      },
      series: ms.map(s => ({
        type: 'column' as const,
        name: s.name,
        color: s.color,
        data: [s.data[lastIndex]?.value ?? 0],
      })),
    };
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
