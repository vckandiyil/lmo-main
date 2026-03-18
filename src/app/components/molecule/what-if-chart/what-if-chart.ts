import {Component, computed, inject, input} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {EMPTY, switchMap, map} from 'rxjs';
import {ChartWrapper} from '../chart-wrapper/chart-wrapper';
import {ChartBuilderService} from '../../../shared/services/chart-builder.service';
import {WidgetDetailConfigService} from '../../../core/services/widget-detail-config.service';
import {DashboardDataService, ThemeService} from '../../../core';
import {WhatIfSimulationService} from '../../../core/services/what-if-simulation.service';
import type {ChartBuildContext} from '../../../core/models/widget-detail.model';

const FORECAST_COLOR = '#75CA65';
const TARGET_COLOR = '#F3393F';

@Component({
  selector: 'app-what-if-chart',
  standalone: true,
  imports: [ChartWrapper],
  templateUrl: './what-if-chart.html',
  styleUrl: './what-if-chart.scss',
})
export class WhatIfChart {
  private readonly configService = inject(WidgetDetailConfigService);
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly chartBuilderService = inject(ChartBuilderService);
  private readonly sim = inject(WhatIfSimulationService);
  private readonly themeService = inject(ThemeService);

  readonly widgetId = input.required<string>();
  readonly height = input<number>(310);

  private readonly chartData = toSignal(
    toObservable(this.widgetId).pipe(
      switchMap(id =>
        this.configService.allConfigs$.pipe(
          switchMap(({configMap}) => {
            const config = configMap.get(id);
            if (!config) return EMPTY;
            return config.loadData(this.dashboardDataService).pipe(
              map(data => ({config, data})),
            );
          }),
        ),
      ),
    ),
  );

  readonly chartOptions = computed(() => {
    const result = this.chartData();
    void this.themeService.isDarkMode(); // reactive: recompute on theme change so Highcharts redraws
    if (!result?.config?.chartConfig || !result?.data?.series?.length) return {};

    const isActive = this.sim.isActive();

    const ctx: ChartBuildContext = {
      forecastEnabled: false,
      forecastSeries: [],
      selectedCompareItems: [],
      relatedSVMap: {},
      forecastRelatedSVMap: {},
      showTooltip: true,
      showDataLabels: true,
      showPreciseValue: false,
    };

    const opts = this.chartBuilderService.build(result.config.chartConfig, result.data.series, ctx);
    const baseOpts = {
      ...opts,
      chart: {...((opts as any).chart ?? {}), height: this.height(), width: null},
    };

    if (!isActive) return baseOpts;

    // --- Simulation mode ---
    const series = result.data.series;
    const primarySeries = result.config.chartConfig.series?.[0];
    const unit = primarySeries?.dataLabels?.unit ?? '';
    const lineWidth = primarySeries?.lineWidth ?? 2;
    const markerR = primarySeries?.markerRadius ?? 4;

    const forecast = this.sim.computeForecast(series);
    const forecastYears = forecast.forecastSeries.map(d => d.year);
    const allCategories = [...series.map(d => d.year), ...forecastYears];

    // Historical blue line: nulls appended for forecast positions
    const actualData = [
      ...series.map(d => d.value),
      ...forecastYears.map(() => null as null),
    ];

    // Lower green forecast data (bridges from last actual)
    const lowerForecastData: (number | null)[] = series.map((d, i) =>
      i === series.length - 1 ? d.value : null,
    );
    forecast.forecastSeries.forEach(d => lowerForecastData.push(d.value));

    // Upper green forecast data (bridges from last actual)
    const upperForecastData: (number | null)[] = series.map((d, i) =>
      i === series.length - 1 ? d.value : null,
    );
    forecast.forecastHighSeries.forEach(d => upperForecastData.push(d.value));

    // Green area band: [low, high] for forecast, null for historical (except bridge)
    const areaData: (null | [number, number])[] = series.map((d, i) =>
      i === series.length - 1 ? ([d.value, d.value] as [number, number]) : null,
    );
    forecast.forecastSeries.forEach((fLow, i) => {
      areaData.push([fLow.value, forecast.forecastHighSeries[i].value]);
    });

    // Red target line (bridges from last actual)
    const targetData: (number | null)[] = series.map((d, i) =>
      i === series.length - 1 ? d.value : null,
    );
    forecast.targetSeries.forEach(d => targetData.push(d.value));

    // Recalculate y-axis bounds to fit all simulation values
    const allValues = [
      ...series.map(d => d.value),
      ...forecast.forecastSeries.map(d => d.value),
      ...forecast.forecastHighSeries.map(d => d.value),
      ...forecast.targetSeries.map(d => d.value),
    ];
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const pad = (maxVal - minVal) * 0.15 || 1;
    const yMin = Math.floor(minVal - pad);
    const yMax = Math.ceil(maxVal + pad);
    const tickCount = 5;
    const rawInterval = (yMax - yMin) / tickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
    const normalized = rawInterval / magnitude;
    const niceInterval = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    const tickInterval = niceInterval * magnitude;

    const dl = makeDataLabels(unit);
    const mk = (color: string) => makeMarker(markerR, color);

    return {
      ...baseOpts,
      xAxis: {...(baseOpts as any).xAxis, categories: allCategories},
      yAxis: {
        ...(baseOpts as any).yAxis,
        min: yMin,
        max: yMax,
        tickInterval,
      },
      series: [
        // Historical blue line
        {
          ...(opts as any).series[0],
          data: actualData,
          zIndex: 3,
        },
        // Green area band (arearange)
        {
          type: 'arearange',
          name: 'Forecast Range',
          color: FORECAST_COLOR,
          fillColor: `${FORECAST_COLOR}26`,
          lineWidth: 0,
          marker: {enabled: false},
          showInLegend: false,
          enableMouseTracking: false,
          connectNulls: true,
          data: areaData,
          zIndex: 0,
        },
        // Lower green forecast line
        {
          type: 'line',
          name: 'Forecast',
          color: FORECAST_COLOR,
          lineWidth,
          dashStyle: 'Solid',
          connectNulls: true,
          data: lowerForecastData,
          marker: mk(FORECAST_COLOR),
          dataLabels: dl,
          showInLegend: false,
          zIndex: 2,
        },
        // Upper green forecast line
        {
          type: 'line',
          name: 'Forecast High',
          color: FORECAST_COLOR,
          lineWidth,
          dashStyle: 'Solid',
          connectNulls: true,
          data: upperForecastData,
          marker: mk(FORECAST_COLOR),
          dataLabels: dl,
          showInLegend: false,
          zIndex: 2,
        },
        // Red dashed target line
        {
          type: 'line',
          name: 'Target',
          color: TARGET_COLOR,
          lineWidth,
          dashStyle: 'Dash',
          connectNulls: true,
          data: targetData,
          marker: mk(TARGET_COLOR),
          dataLabels: makeDataLabels(unit, TARGET_COLOR),
          showInLegend: false,
          zIndex: 1,
        },
      ],
    };
  });
}

function makeMarker(radius: number, color: string): any {
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

function makeDataLabels(unit: string, fixedColor?: string): any {
  return {
    enabled: true,
    useHTML: true,
    formatter: function (this: any): string {
      if (this.y == null) return '';
      const color = fixedColor ?? (document.body.classList.contains('theme--dark') ? '#FFFFFF' : '#1E2937');
      const display =
        unit === '%'
          ? `${Math.round(this.y * 10) / 10}%`
          : Number(this.y).toLocaleString('en-US', {maximumFractionDigits: 0});
      return `<span style="color: ${color}; font-family: 'Graphik Trial', sans-serif; font-weight: 600; font-size: 14px; line-height: 21px;">${display}</span>`;
    },
    style: {
      fontFamily: "'Graphik Trial', sans-serif",
      fontWeight: '600',
      fontSize: '14px',
      textOutline: 'none',
    },
    verticalAlign: 'bottom',
    y: -8,
    overflow: 'allow',
    crop: false,
  };
}
