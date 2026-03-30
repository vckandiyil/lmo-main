import {inject, Injectable} from '@angular/core';
import type {ChartOptions} from './chart-config.service';
import type {ChartBuildContext, MultiSeriesItem, WidgetDetailSeriesPoint} from '../../core/models/widget-detail.model';
import type {WidgetChartConfig} from '../../core/models/widget-chart-config.model';
import {ChartBuilderService} from './chart-builder.service';
import {ThemeService} from '../../core/services/theme.service';
import {abbreviateNumber} from '../utils/number-format';

const MINI_CHART_HEIGHT = 150;
const CHART_FONT        = "'Graphik Trial', sans-serif";
const MINI_LABEL_STYLE  = `color:var(--lmo-text-category);font-family:${CHART_FONT};font-weight:400;font-size:12px;`;
const COLOR_GRID_MINI   = '#CFDCEC';
const miniLegend = (isDark: boolean) => ({
  enabled: true,
  align: 'center' as const,
  verticalAlign: 'bottom' as const,
  layout: 'horizontal' as const,
  symbolRadius: 3,
  symbolWidth: 6,
  symbolHeight: 6,
  itemDistance: 6,
  padding: 2,
  margin: 6,
  maxHeight: 20,
  navigation: {enabled: false},
  itemStyle: {fontFamily: CHART_FONT, fontWeight: '400', fontSize: '9px', color: isDark ? '#FFFFFF' : '#1E2937'},
});

const MINI_CTX: ChartBuildContext = {
  forecastEnabled:      false,
  forecastSeries:       [],
  selectedCompareItems: [],
  relatedSVMap:         {},
  forecastRelatedSVMap: {},
  showTooltip:          false,
  showDataLabels:       true,
};

const MINI_INSIDE_DATA_LABELS = {
  enabled: true,
  inside: true,
  useHTML: true,
  verticalAlign: 'middle' as const,
  crop: false,
  overflow: 'allow' as const,
  formatter: function(this: any): string {
    if (this.y == null) return '';
    return `<span style="color:#fff;font-family:${CHART_FONT};font-weight:600;font-size:10px;">${abbreviateNumber(this.y)}</span>`;
  },
  style: {textOutline: 'none'},
};

const MINI_TOP_DATA_LABELS = {
  enabled: true,
  inside: false,
  useHTML: true,
  verticalAlign: 'top' as const,
  y: -2,
  crop: false,
  overflow: 'allow' as const,
  formatter: function(this: any): string {
    if (this.y == null) return '';
    const color = document.body.classList.contains('theme--dark') ? '#FFFFFF' : '#1E2937';
    return `<span style="color:${color};font-family:${CHART_FONT};font-weight:600;font-size:10px;">${abbreviateNumber(this.y)}</span>`;
  },
  style: {textOutline: 'none'},
};

@Injectable({providedIn: 'root'})
export class MiniChartBuilderService {
  private readonly chartBuilderService = inject(ChartBuilderService);
  private readonly themeService        = inject(ThemeService);

  build(
    config: WidgetChartConfig,
    series: WidgetDetailSeriesPoint[],
    multiSeries: MultiSeriesItem[] | undefined,
    unit: string,
    isCenter: boolean,
  ): ChartOptions {
    const height = isCenter ? undefined : MINI_CHART_HEIGHT;
    const type   = config.type;
    const isDark = this.themeService.isDarkMode();

    if (type === 'stacked-bar' && multiSeries?.length) {
      return this.buildMiniStackedBar(multiSeries, config.orientation === 'horizontal', height, isDark);
    }
    if (type === 'grouped-column' && multiSeries?.length) {
      return this.buildMiniGroupedColumn(multiSeries, height, isDark);
    }
    if (type === 'pie' || type === 'donut') {
      const built = this.chartBuilderService.build(config, series, MINI_CTX);
      return {...built, chart: {...(built.chart ?? {}), height}};
    }
    return this.buildMiniCartesian(series, type as 'line' | 'column' | 'bar', unit, height, config.series?.[0]?.name ?? '', isDark);
  }

  private buildMiniStackedBar(
    ms: MultiSeriesItem[],
    horizontal: boolean,
    height: number | undefined,
    isDark: boolean = false,
  ): ChartOptions {
    const hcType      = horizontal ? 'bar' : 'column';
    const categories  = ms[0].data.map(d => d.year);
    const tooltipBg   = isDark ? '#1E2937' : '#FFFFFF';
    const tooltipText = isDark ? '#FFFFFF'  : '#1E2937';

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
        const val = abbreviateNumber(this.y);
        return `<span style="font-family:${CHART_FONT};font-size:12px;color:${tooltipText};">` +
          `<span style="color:${this.color};">&#9679;</span> ${this.series.name}: <b>${val}</b></span>`;
      },
    };

    if (horizontal) {
      return {
        colors: ms.map(s => s.color),
        chart: {type: 'bar', height, backgroundColor: 'transparent', spacing: [8, 20, 8, 0], marginLeft: 52},
        title: {text: ''},
        xAxis: {
          categories,
          labels: {enabled: true, style: {color: 'var(--lmo-text-category)', fontFamily: CHART_FONT, fontWeight: '400', fontSize: '12px'}},
          lineWidth: 0, tickWidth: 0,
        },
        yAxis: {title: {text: ''}, labels: {enabled: false}, gridLineWidth: 1, gridLineColor: COLOR_GRID_MINI},
        legend: miniLegend(isDark),
        tooltip: miniTooltip,
        credits: {enabled: false},
        plotOptions: {
          bar: {stacking: 'normal', borderWidth: 0, borderRadius: 0, dataLabels: MINI_INSIDE_DATA_LABELS},
        },
        series: ms.map(s => ({type: 'bar' as const, name: s.name, color: s.color, data: s.data.map(d => d.value)})),
      };
    }

    const stackTotals = categories.map((_: string, i: number) =>
      ms.reduce((sum, s) => sum + (s.data[i]?.value ?? 0), 0),
    );
    const stackMax = Math.max(...stackTotals);
    const ySnap  = stackMax >= 1_000_000 ? 100_000 : stackMax >= 10_000 ? 1_000 : stackMax >= 1_000 ? 100 : 10;
    const yMax   = Math.ceil(stackMax * 1.1 / ySnap) * ySnap || ySnap;
    const yFmt   = stackMax >= 1_000_000
      ? (v: number) => `${(v / 1_000_000).toFixed(1)}M`
      : stackMax >= 10_000
        ? (v: number) => `${(v / 1_000).toFixed(0)}K`
        : (v: number) => `${v}`;

    return {
      colors: ms.map(s => s.color),
      chart: {type: 'column', height, backgroundColor: 'transparent', spacing: [18, 10, 20, 0]},
      title: {text: ''},
      xAxis: {
        categories,
        labels: {enabled: true, y: 14, useHTML: true, formatter: function(this: any) { return `<span style="${MINI_LABEL_STYLE}">${this.value}</span>`; }},
        lineWidth: 0, tickWidth: 0, offset: 4,
      },
      yAxis: {
        min: 0, max: yMax, endOnTick: false, tickAmount: 4,
        title: {text: ''},
        labels: {
          enabled: true, y: 4, useHTML: true,
          formatter: function(this: any) { return `<span style="${MINI_LABEL_STYLE}">${yFmt(this.value as number)}</span>`; },
        },
        gridLineColor: COLOR_GRID_MINI, gridLineWidth: 0.5,
      },
      legend: miniLegend(isDark),
      tooltip: miniTooltip,
      credits: {enabled: false},
      plotOptions: {
        column: {stacking: 'normal', borderWidth: 0, borderRadius: 0, dataLabels: MINI_INSIDE_DATA_LABELS},
      },
      series: ms.map(s => ({type: 'column' as const, name: s.name, color: s.color, data: s.data.map(d => d.value)})),
    };
  }

  private buildMiniGroupedColumn(ms: MultiSeriesItem[], height: number | undefined, isDark: boolean = false): ChartOptions {
    const lastIndex = ms[0].data.length - 1;
    const lastYear  = ms[0].data[lastIndex]?.year ?? '';

    return {
      colors: ms.map(s => s.color),
      chart: {type: 'column', height, backgroundColor: 'transparent', spacing: [18, 10, 20, 0]},
      title: {text: ''},
      xAxis: {
        categories: [lastYear],
        labels: {enabled: true, y: 14, useHTML: true, formatter: function(this: any) { return `<span style="${MINI_LABEL_STYLE}">${this.value}</span>`; }},
        lineWidth: 0, tickWidth: 0, offset: 4,
      },
      yAxis: {title: {text: ''}, labels: {enabled: false}, gridLineColor: COLOR_GRID_MINI, gridLineWidth: 0.5},
      legend: miniLegend(isDark),
      tooltip: {enabled: false},
      credits: {enabled: false},
      plotOptions: {
        column: {grouping: true, borderWidth: 0, borderRadius: 0, dataLabels: MINI_TOP_DATA_LABELS},
      },
      series: ms.map(s => ({
        type: 'column' as const,
        name: s.name,
        color: s.color,
        data: [s.data[lastIndex]?.value ?? 0],
      })),
    };
  }

  private buildMiniCartesian(
    series: WidgetDetailSeriesPoint[],
    chartType: 'line' | 'column' | 'bar',
    unit: string,
    height: number | undefined,
    name: string = '',
    isDark: boolean = false,
  ): ChartOptions {
    const isPercent = unit.includes('%');
    const values    = series.map(d => d.value);
    const years     = series.map(d => d.year);
    const isMillion = !isPercent && values.some(v => Math.abs(v) >= 100_000);

    // Horizontal bars don't fit the mini card height — render as column
    const hcType = chartType === 'bar' ? 'column' : chartType;

    // Column/bar charts start at 0 for proper proportional comparison.
    // Line charts use dynamic range to emphasise trend.
    const {yMin: calcYMin, yMax, tickInterval: calcTick} = this.calcYAxis(values, isPercent, isMillion);
    const yMin = (hcType !== 'line' && !isPercent && values.every(v => v >= 0)) ? 0 : calcYMin;
    const tickInterval = Math.max(1, Math.round((yMax - yMin) / 4));

    const dlStyle = {
      fontFamily: CHART_FONT,
      fontWeight: '500',
      fontSize: '12px',
      color: '#3375C6',
      textOutline: 'none',
    };
    const dlFormat = isMillion
      ? {formatter: function(this: any) { return ((this.y as number) / 1_000_000).toFixed(1) + 'M'; }}
      : {format: isPercent ? '{y}%' : '{y}'};

    return {
      chart: {type: hcType, height, backgroundColor: 'transparent', spacing: [18, 10, 20, 0]},
      title: {text: ''},
      xAxis: {
        categories: years,
        labels: {enabled: true, y: 14, useHTML: true, formatter: function(this: any) { return `<span style="${MINI_LABEL_STYLE}">${this.value}</span>`; }},
        lineWidth: 0, tickWidth: 0, offset: 4,
      },
      yAxis: {
        min: yMin, max: yMax, tickInterval,
        title: {text: ''},
        labels: {
          enabled: true, y: 4, useHTML: true,
          formatter: isMillion
            ? function(this: any) { return `<span style="${MINI_LABEL_STYLE}">${((this.value as number) / 1_000_000).toFixed(1)}M</span>`; }
            : function(this: any) { return `<span style="${MINI_LABEL_STYLE}">${this.value}</span>`; },
        },
        gridLineColor: COLOR_GRID_MINI, gridLineWidth: 0.5,
      },
      legend: miniLegend(isDark),
      tooltip: {enabled: false},
      credits: {enabled: false},
      plotOptions: {
        column: {borderRadius: 3, dataLabels: {enabled: true, ...dlFormat, style: dlStyle, crop: false, overflow: 'allow' as const}},
        bar:    {borderRadius: 3, dataLabels: {enabled: true, ...dlFormat, style: dlStyle, crop: false, overflow: 'allow' as const}},
        line: {
          marker: {enabled: true, symbol: 'circle', radius: 2.5, fillColor: '#3375C6', lineWidth: 0, lineColor: '#3375C6'},
          dataLabels: {enabled: true, ...dlFormat, style: {...dlStyle, lineHeight: '12px'}, verticalAlign: 'bottom', y: -2, overflow: 'allow', crop: false},
          states: {hover: {enabled: false}},
        },
      },
      series: [{type: hcType as any, name, color: '#3375C6', lineWidth: 2, data: values}],
    };
  }

  private calcYAxis(
    values: number[],
    isPercent: boolean,
    isMillion: boolean,
  ): {yMin: number; yMax: number; tickInterval: number} {
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
