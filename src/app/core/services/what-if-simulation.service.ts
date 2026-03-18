import {Injectable, WritableSignal, computed, signal} from '@angular/core';
import type {WidgetDetailSeriesPoint} from '../models/widget-detail.model';

export interface WhatIfForecast {
  forecastSeries: WidgetDetailSeriesPoint[];
  forecastHighSeries: WidgetDetailSeriesPoint[];
  targetSeries: WidgetDetailSeriesPoint[];
}

export interface WhatIfSimDriver {
  label: string;
  value: WritableSignal<number>;
}

@Injectable({providedIn: 'root'})
export class WhatIfSimulationService {
  readonly drivers: WhatIfSimDriver[] = [
    {label: 'Labor Force Participation', value: signal(0)},
    {label: 'Economic Growth', value: signal(0)},
    {label: 'Sector Employment Growth', value: signal(0)},
    {label: 'Emiratization Adjustment', value: signal(0)},
    {label: 'Private Sector Incentives', value: signal(0)},
  ];

  readonly totalAdjustment = computed(() =>
    this.drivers.reduce((sum, d) => sum + d.value(), 0) / this.drivers.length,
  );

  readonly isActive = computed(() => this.totalAdjustment() !== 0);

  computeForecast(series: WidgetDetailSeriesPoint[]): WhatIfForecast {
    if (series.length === 0) {
      return {forecastSeries: [], forecastHighSeries: [], targetSeries: []};
    }

    const adjustment = this.totalAdjustment();
    const lastPoint = series[series.length - 1];
    const lastYear = parseInt(lastPoint.year);
    const lastValue = lastPoint.value;

    const recent = series.slice(-4);
    const baseTrend =
      recent.length >= 2
        ? (recent[recent.length - 1].value - recent[0].value) / (recent.length - 1)
        : 0;

    const forecastSeries: WidgetDetailSeriesPoint[] = [];
    const forecastHighSeries: WidgetDetailSeriesPoint[] = [];
    const targetSeries: WidgetDetailSeriesPoint[] = [];

    for (let i = 1; i <= 3; i++) {
      const year = String(lastYear + i);
      const boost = adjustment * 0.3 * i;
      const fLow = r1(lastValue + baseTrend * i * 0.4 + boost);
      const fHigh = r1(fLow + Math.abs(adjustment) * 0.2 * i);
      const target = r1(lastValue + baseTrend * i * 0.6 - Math.abs(adjustment) * 0.1 * i);

      forecastSeries.push({year, value: fLow});
      forecastHighSeries.push({year, value: fHigh});
      targetSeries.push({year, value: target});
    }

    return {forecastSeries, forecastHighSeries, targetSeries};
  }
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}
