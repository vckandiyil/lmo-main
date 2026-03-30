import {inject, Injectable} from '@angular/core';
import type {ChartOptions} from './chart-config.service';
import type {WidgetChartConfig, WidgetYAxisConfig} from '../../core/models/widget-chart-config.model';
import type {ChartBuildContext, WidgetDetailSeriesPoint} from '../../core/models/widget-detail.model';
import {abbreviateNumber} from '../utils/number-format';
import {ThemeService} from '../../core/services/theme.service';

const FORECAST_COLOR_DEFAULT = '#5CC049';
const CHART_FONT             = "'Graphik Trial', sans-serif";
const COLOR_AXIS_LABEL       = '#6A7180';
const COLOR_GRID             = '#E8E8E8';

@Injectable({providedIn: 'root'})
export class ChartBuilderService {
  private readonly themeService = inject(ThemeService);

  private legendConfig() {
    const color = this.themeService.isDarkMode() ? '#FFFFFF' : '#1E2937';
    return {enabled: true, align: 'center' as const, verticalAlign: 'bottom' as const, itemStyle: {fontFamily: CHART_FONT, fontWeight: '400', color}};
  }

  build(
    config: WidgetChartConfig,
    series: WidgetDetailSeriesPoint[],
    ctx: ChartBuildContext,
  ): ChartOptions {
    switch (config.type) {
      case 'line':           return this.buildLine(config, series, ctx);
      case 'bar':            return this.buildBar(config, series, ctx);
      case 'column':         return this.buildColumn(config, series, ctx);
      case 'pie':
      case 'donut':          return this.buildPie(config, series, ctx);
      case 'stacked-bar':    return this.buildStackedBar(config, ctx);
      case 'grouped-column': return this.buildGroupedColumn(config, ctx);
      default:               return this.buildCustom(config.type, config, series, ctx);
    }
  }

  // ---------------------------------------------------------------------------
  // Private builders
  // ---------------------------------------------------------------------------

  private buildLine(
    config: WidgetChartConfig,
    series: WidgetDetailSeriesPoint[],
    ctx: ChartBuildContext,
  ): ChartOptions {
    if (series.length === 0) return {};

    const primarySeries = config.series?.[0];
    const forecastColor = config.forecast?.color ?? FORECAST_COLOR_DEFAULT;
    const forecastDash  = config.forecast?.dashStyle ?? 'Dash';
    const compareDash   = config.compare?.dashStyle ?? 'ShortDash';
    const unit          = primarySeries?.dataLabels?.unit ?? '';
    const markerRadius  = primarySeries?.markerRadius ?? 4;
    const primaryColor  = primarySeries?.color ?? '#2563EA';

    const {forecastEnabled, forecastSeries, selectedCompareItems, relatedSVMap, forecastRelatedSVMap} = ctx;
    const showDL      = ctx.showDataLabels ?? true;
    const precise     = ctx.showPreciseValue ?? false;
    const hasForecast = forecastEnabled && forecastSeries.length > 0;

    const categories = hasForecast
      ? [...series.map(d => d.year), ...forecastSeries.map(d => d.year)]
      : series.map(d => d.year);

    const actualValues: (number | null)[] = series.map(d => d.value);
    if (hasForecast) {
      actualValues.push(...forecastSeries.map(() => null));
    }

    const allRates = [...series.map(d => d.value)];
    const extraSeries: any[] = [];

    if (hasForecast) {
      const forecastData: (number | null)[] = series.map((_, i) =>
        i === series.length - 1 ? series[series.length - 1].value : null,
      );
      forecastData.push(...forecastSeries.map(d => d.value));
      forecastSeries.forEach(d => allRates.push(d.value));

      extraSeries.push({
        type: 'line',
        name: 'Forecast',
        color: forecastColor,
        lineWidth: primarySeries?.lineWidth ?? 2,
        dashStyle: forecastDash,
        connectNulls: true,
        data: forecastData,
        marker: this.makeMarker(markerRadius, forecastColor),
        dataLabels: this.makeDataLabels(unit, -8, showDL, precise),
      });
    }

    for (const item of selectedCompareItems) {
      const entry = relatedSVMap[item.id];
      if (!entry) continue;

      const dataMap     = new Map(entry.data.map(d => [d.YEAR, this.roundValue(d.VALUE, unit)]));
      const actualYears = new Set(entry.data.map(d => d.YEAR));
      const cmpValues: (number | null)[] = categories.map(year =>
        actualYears.has(year) ? (dataMap.get(year) ?? null) : null,
      );

      cmpValues.forEach(v => { if (v !== null) allRates.push(v); });

      extraSeries.push({
        type: 'line',
        name: entry.title,
        color: item.color,
        lineWidth: primarySeries?.lineWidth ?? 2,
        dashStyle: compareDash,
        data: cmpValues,
        marker: this.makeMarker(markerRadius - 1, item.color),
        dataLabels: {enabled: showDL, overflow: 'allow', crop: false},
      });

      if (hasForecast) {
        const forecastSV = forecastRelatedSVMap[item.id];
        if (forecastSV) {
          const forecastMap     = new Map(forecastSV.map(d => [d.YEAR, this.roundValue(d.VALUE, unit)]));
          const lastActualYear  = entry.data[entry.data.length - 1]?.YEAR;
          const lastActualValue = dataMap.get(lastActualYear!) ?? null;

          const cmpForecastValues: (number | null)[] = categories.map(year => {
            if (year === lastActualYear) return lastActualValue;
            if (forecastMap.has(year)) return forecastMap.get(year)!;
            return null;
          });

          cmpForecastValues.forEach(v => { if (v !== null) allRates.push(v); });

          extraSeries.push({
            type: 'line',
            name: `${entry.title} (Forecast)`,
            color: forecastColor,
            lineWidth: primarySeries?.lineWidth ?? 2,
            dashStyle: forecastDash,
            connectNulls: true,
            data: cmpForecastValues,
            showInLegend: false,
            marker: this.makeMarker(markerRadius - 1, forecastColor),
            dataLabels: this.makeDataLabels(unit, -8, showDL, precise),
          });
        }
      }
    }

    const {yMin, yMax} = this.calcYBounds(config.yAxis ?? {}, allRates);
    const tickCount    = config.yAxis?.tickCount ?? 5;
    const width        = config.dimensions?.width;
    const height       = config.dimensions?.height;

    return {
      chart: {
        type: 'line',
        ...(width  ? {width}  : {}),
        ...(height ? {height} : {}),
        backgroundColor: 'transparent',
        spacing: [40, 0, 20, 0],
      },
      title: {text: ''},
      xAxis: this.buildXAxis(categories),
      yAxis: this.buildYAxis(yMin, yMax, tickCount, unit, precise),
      legend:  this.legendConfig(),
      tooltip: {enabled: ctx.showTooltip ?? false, hideDelay: 0},
      credits: {enabled: false},
      plotOptions: {
        line: {
          marker: this.makeMarker(markerRadius, primaryColor),
          dataLabels: this.makeDataLabels(unit, -8, showDL, precise),
          states: {hover: {lineWidth: primarySeries?.lineWidth ?? 2, halo: {size: 0}}},
          point: {
            events: {
              mouseOver(this: any) { this.dataLabel?.hide(); },
              mouseOut(this: any)  { this.dataLabel?.show(); },
            },
          },
        },
      },
      series: [
        {
          type: 'line',
          name: primarySeries?.name ?? '',
          color: primaryColor,
          lineWidth: primarySeries?.lineWidth ?? 2,
          data: actualValues,
        } as any,
        ...extraSeries,
      ],
    };
  }

  private buildBar(
    config: WidgetChartConfig,
    series: WidgetDetailSeriesPoint[],
    ctx: ChartBuildContext,
  ): ChartOptions {
    if (series.length === 0) return {};
    const primarySeries = config.series?.[0];
    const unit          = primarySeries?.dataLabels?.unit ?? '';
    const forecastColor = config.forecast?.color ?? FORECAST_COLOR_DEFAULT;
    const primaryColor  = primarySeries?.color ?? '#2563EA';

    const {forecastEnabled, forecastSeries, selectedCompareItems, relatedSVMap} = ctx;
    const showDL      = ctx.showDataLabels ?? true;
    const precise     = ctx.showPreciseValue ?? false;
    const hasForecast = forecastEnabled && forecastSeries.length > 0;

    const categories = hasForecast
      ? [...series.map(d => d.year), ...forecastSeries.map(d => d.year)]
      : series.map(d => d.year);

    const actualValues: (number | null)[] = series.map(d => d.value);
    if (hasForecast) actualValues.push(...forecastSeries.map(() => null));

    const allValues = [...series.map(d => d.value)];
    const extraSeries: any[] = [];

    if (hasForecast) {
      const forecastData: (number | null)[] = series.map(() => null);
      forecastData.push(...forecastSeries.map(d => d.value));
      forecastSeries.forEach(d => allValues.push(d.value));
      extraSeries.push({type: 'bar', name: 'Forecast', color: forecastColor, data: forecastData});
    }

    for (const item of selectedCompareItems) {
      const entry = relatedSVMap[item.id];
      if (!entry) continue;
      const dataMap  = new Map(entry.data.map(d => [d.YEAR, this.roundValue(d.VALUE, unit)]));
      const cmpYears = new Set(entry.data.map(d => d.YEAR));
      const cmpVals: (number | null)[] = categories.map(y => cmpYears.has(y) ? (dataMap.get(y) ?? null) : null);
      cmpVals.forEach(v => { if (v !== null) allValues.push(v); });
      extraSeries.push({type: 'bar', name: entry.title, color: item.color, data: cmpVals});
    }

    const {yMin, yMax} = this.calcYBounds(config.yAxis ?? {}, allValues);
    const tickCount    = config.yAxis?.tickCount ?? 5;

    return {
      chart: {type: 'bar', backgroundColor: 'transparent', spacing: [40, 0, 20, 0]},
      title: {text: ''},
      xAxis: this.buildXAxis(categories),
      yAxis: this.buildYAxis(yMin, yMax, tickCount, unit, precise),
      legend:  this.legendConfig(),
      tooltip: {enabled: ctx.showTooltip ?? false, hideDelay: 0},
      credits: {enabled: false},
      plotOptions: {
        bar: {dataLabels: {enabled: showDL}},
      },
      series: [
        {type: 'bar', name: primarySeries?.name ?? '', color: primaryColor, data: actualValues} as any,
        ...extraSeries,
      ],
    };
  }

  private buildColumn(
    config: WidgetChartConfig,
    series: WidgetDetailSeriesPoint[],
    ctx: ChartBuildContext,
  ): ChartOptions {
    const bar = this.buildBar(config, series, ctx);
    return {
      ...bar,
      chart: {...(bar.chart ?? {}), type: 'column'},
      series: (bar.series as any[]).map(s => ({...s, type: 'column'})),
    };
  }

  private buildPie(
    config: WidgetChartConfig,
    series: WidgetDetailSeriesPoint[],
    ctx: ChartBuildContext,
  ): ChartOptions {
    if (series.length === 0) return {};
    const primarySeries = config.series?.[0];
    const forecastColor = config.forecast?.color ?? FORECAST_COLOR_DEFAULT;

    const {forecastEnabled, forecastSeries, selectedCompareItems, relatedSVMap} = ctx;
    const hasForecast  = forecastEnabled && forecastSeries.length > 0;
    const compareItems = selectedCompareItems.filter(i => !!relatedSVMap[i.id]);
    const hasCompare   = compareItems.length > 0;

    const mainData: any[] = series.map(d => ({name: d.year, y: d.value}));
    if (hasForecast) {
      forecastSeries.forEach(d => mainData.push({name: d.year, y: d.value, color: forecastColor}));
    }

    const outerSize = '80%';
    const innerSize = hasCompare ? '50%' : '0%';

    const pieSeries: any[] = [{
      type: 'pie',
      name: primarySeries?.name ?? '',
      data: mainData,
      size: outerSize,
      innerSize,
    }];

    let ringOuter = 45;
    for (const item of compareItems) {
      const entry     = relatedSVMap[item.id];
      const ringInner = Math.max(ringOuter - 25, 0);
      pieSeries.push({
        type: 'pie',
        name: entry.title,
        data: entry.data.map(d => ({name: d.YEAR, y: d.VALUE, color: item.color})),
        size:      `${ringOuter}%`,
        innerSize: `${ringInner}%`,
      });
      ringOuter = ringInner - 5;
      if (ringOuter <= 0) break;
    }

    return {
      chart: {type: 'pie', backgroundColor: 'transparent'},
      title: {text: ''},
      credits: {enabled: false},
      legend: this.legendConfig(),
      tooltip: {enabled: ctx.showTooltip ?? false, hideDelay: 0},
      xAxis: {visible: false},
      yAxis: {visible: false, gridLineWidth: 0},
      plotOptions: {
        pie: {dataLabels: {enabled: ctx.showDataLabels ?? true}},
      },
      series: pieSeries as any,
    };
  }

  private buildStackedBar(
    config: WidgetChartConfig,
    ctx: ChartBuildContext,
  ): ChartOptions {
    const items = ctx.multiSeries;
    if (!items?.length) return {};

    const showDL     = ctx.showDataLabels ?? true;
    const precise    = ctx.showPreciseValue ?? false;
    const unit       = config.yAxis?.unit ?? '';
    const horizontal = config.orientation === 'horizontal';
    const hcType     = horizontal ? 'bar' : 'column';

    const categories  = items[0].data.map(d => d.year);
    const stackTotals = Array.from({length: items[0].data.length}, (_, i) =>
      items.reduce((sum, s) => sum + (s.data[i]?.value ?? 0), 0),
    );
    const {yMax}    = this.calcYBounds(config.yAxis ?? {}, stackTotals);
    const tickCount = config.yAxis?.tickCount ?? 5;
    const width     = config.dimensions?.width;
    const height    = config.dimensions?.height;

    const compareSeries: any[] = ctx.selectedCompareItems.map(item => {
      const entry = ctx.relatedSVMap[item.id];
      if (!entry) return null;
      const dataMap = new Map(entry.data.map(d => [d.YEAR, d.VALUE]));
      return {
        type: 'line',
        name: entry.title,
        color: item.color,
        data: categories.map(c => dataMap.get(c) ?? null),
        marker: this.makeMarker(4, item.color),
        dataLabels: {enabled: showDL, overflow: 'allow', crop: false},
        yAxis: 1,
      };
    }).filter(Boolean);

    const yAxes: any[] = [this.buildYAxis(0, yMax, tickCount, unit, precise)];
    if (compareSeries.length) {
      const allCompareVals = ctx.selectedCompareItems
        .flatMap(item => (ctx.relatedSVMap[item.id]?.data ?? []).map(d => d.VALUE));
      const {yMax: cmpMax} = this.calcYBounds(config.yAxis ?? {}, allCompareVals);
      yAxes.push({...this.buildYAxis(0, cmpMax, tickCount, unit, precise), opposite: true});
    }

    return {
      colors: items.map(s => s.color),
      chart: {
        type: hcType,
        ...(width  ? {width}  : {}),
        ...(height ? {height} : {}),
        backgroundColor: 'transparent',
        spacing: [40, 0, 20, 0],
      },
      title:   {text: ''},
      xAxis:   this.buildXAxis(categories),
      yAxis:   compareSeries.length ? yAxes : yAxes[0],
      legend:  this.legendConfig(),
      tooltip: {enabled: ctx.showTooltip ?? false, hideDelay: 0},
      credits: {enabled: false},
      plotOptions: {
        [hcType]: {
          stacking: 'normal',
          dataLabels: this.makeBarDataLabels(unit, showDL, true),
          borderWidth: 0,
          borderRadius: 0,
        },
      },
      series: [
        ...items.map(s => ({
          type:  hcType as 'bar' | 'column',
          name:  s.name,
          color: s.color,
          data:  s.data.map(d => d.value),
        })),
        ...compareSeries,
      ] as any,
    };
  }

  private buildGroupedColumn(
    config: WidgetChartConfig,
    ctx: ChartBuildContext,
  ): ChartOptions {
    const items = ctx.multiSeries;
    if (!items?.length) return {};

    const showDL  = ctx.showDataLabels ?? true;
    const precise = ctx.showPreciseValue ?? false;
    const unit    = config.yAxis?.unit ?? '';

    const categories   = items[0].data.map(d => d.year);
    const allValues    = items.flatMap(s => s.data.map(d => d.value));
    const {yMin, yMax} = this.calcYBounds(config.yAxis ?? {}, allValues);
    const tickCount    = config.yAxis?.tickCount ?? 5;
    const width        = config.dimensions?.width;
    const height       = config.dimensions?.height;

    return {
      colors: items.map(s => s.color),
      chart: {
        type: 'column',
        ...(width  ? {width}  : {}),
        ...(height ? {height} : {}),
        backgroundColor: 'transparent',
        spacing: [40, 0, 20, 0],
      },
      title:   {text: ''},
      xAxis:   this.buildXAxis(categories),
      yAxis:   this.buildYAxis(yMin, yMax, tickCount, unit, precise),
      legend:  this.legendConfig(),
      tooltip: {enabled: ctx.showTooltip ?? false, hideDelay: 0},
      credits: {enabled: false},
      plotOptions: {
        column: {
          grouping: true,
          dataLabels: this.makeBarDataLabels(unit, showDL, false),
          borderWidth: 0,
          borderRadius: 0,
        },
      },
      series: items.map(s => ({
        type:  'column' as const,
        name:  s.name,
        color: s.color,
        data:  s.data.map(d => d.value),
      })) as any,
    };
  }

  private buildCustom(
    _type: string,
    _config: WidgetChartConfig,
    _series: WidgetDetailSeriesPoint[],
    _ctx: ChartBuildContext,
  ): ChartOptions {
    return {};
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private calcYBounds(cfg: WidgetYAxisConfig, values: number[]): {yMin: number; yMax: number} {
    if (values.length === 0) return {yMin: 0, yMax: 100};

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    if (cfg.paddingFactor !== undefined) {
      const snap    = cfg.snapTo ?? 1;
      const padding = (maxVal - minVal) * cfg.paddingFactor || snap;
      return {
        yMin: Math.floor((minVal - padding) / snap) * snap,
        yMax: Math.ceil((maxVal + padding)  / snap) * snap,
      };
    }

    const rawMin = minVal - (cfg.minPadding ?? 0);
    const rawMax = maxVal + (cfg.maxPadding ?? 0);
    return {
      yMin: Math.floor(rawMin),
      yMax: cfg.maxCap !== undefined ? Math.min(cfg.maxCap, Math.ceil(rawMax)) : Math.ceil(rawMax),
    };
  }

  private roundValue(value: number, unit: string): number {
    return unit === '%' ? Math.round(value * 10) / 10 : value;
  }

  private makeBarDataLabels(unit: string, enabled: boolean, inside: boolean): any {
    return {
      enabled,
      useHTML: true,
      inside,
      verticalAlign: inside ? 'middle' : 'top',
      overflow: 'allow',
      crop: false,
      formatter: function(this: any): string {
        if (this.y == null) return '';
        const isDark  = document.body.classList.contains('theme--dark');
        const color   = inside ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#1E2937');
        const display = unit === '%'
          ? `${Math.round(this.y * 10) / 10}%`
          : abbreviateNumber(this.y);
        return `<span style="color:${color};font-family:${CHART_FONT};font-weight:600;font-size:12px;line-height:18px;">${display}</span>`;
      },
      style: {fontFamily: CHART_FONT, fontWeight: '600', fontSize: '12px', textOutline: 'none'},
    };
  }

  private makeMarker(radius: number, color: string): any {
    return {
      enabled: true,
      symbol: 'circle',
      radius,
      fillColor: color,
      lineWidth: 0,
      lineColor: color,
      states: {hover: {radius}},
    };
  }

  private makeDataLabels(unit: string, yOffset: number, enabled = true, precise = false): any {
    return {
      enabled,
      useHTML: true,
      formatter: function(this: any): string {
        if (this.y == null) return '';
        const isDark = document.body.classList.contains('theme--dark');
        const color  = isDark ? '#FFFFFF' : '#1E2937';
        let display: string;
        if (precise) {
          display = unit === '%'
            ? `${this.y}%`
            : Number(this.y).toLocaleString('en-US', {maximumFractionDigits: 0});
        } else {
          display = unit === '%'
            ? `${Math.round(this.y * 10) / 10}%`
            : abbreviateNumber(this.y);
        }
        return `<span style="color:${color};font-family:${CHART_FONT};font-weight:600;font-size:14px;line-height:21px;">${display}</span>`;
      },
      style: {fontFamily: CHART_FONT, fontWeight: '600', fontSize: '14px', color: '#1E2937', textOutline: 'none'},
      verticalAlign: 'bottom',
      y: yOffset,
      overflow: 'allow',
      crop: false,
    };
  }

  private buildXAxis(categories: string[]): any {
    return {
      visible: true,
      categories,
      labels: {
        enabled: true,
        step: 1,
        y: 20,
        autoRotation: [] as number[],
        useHTML: true,
        formatter: function(this: any): string {
          return `<span style="color:${COLOR_AXIS_LABEL};font-family:${CHART_FONT};font-weight:400;font-size:14px;line-height:21px;">${this.value}</span>`;
        },
      },
      tickmarkPlacement: 'on',
      offset: 20,
      lineColor: 'transparent',
      lineWidth: 0,
      tickWidth: 0,
      minPadding: 0,
      maxPadding: 0,
    };
  }

  private buildYAxis(yMin: number, yMax: number, tickCount: number, unit: string, precise = false): any {
    return {
      visible: true,
      min: yMin,
      max: yMax,
      endOnTick: false,
      tickInterval: (yMax - yMin) / tickCount,
      title: {text: ''},
      labels: {
        enabled: true,
        useHTML: true,
        formatter: function(this: any): string {
          let display: string;
          if (unit === '%') {
            display = `${this.value}`;
          } else if (precise) {
            display = Number(this.value).toLocaleString('en-US', {maximumFractionDigits: 0});
          } else {
            display = abbreviateNumber(this.value);
          }
          return `<span style="color:${COLOR_AXIS_LABEL};font-family:${CHART_FONT};font-weight:400;font-size:14px;line-height:21px;text-align:right;">${display}</span>`;
        },
      },
      gridLineColor: COLOR_GRID,
      gridLineWidth: 1,
      gridLineDashStyle: 'Solid',
    };
  }
}
