import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {API_BASE_URL} from '../tokens/api-base-url.token';
import {catchError, forkJoin, map, Observable, of, shareReplay, switchMap} from 'rxjs';
import type {FilterConfig} from '../../components/molecule/filter-bar/filter-bar';
import type {
  MultiSeriesItem,
  WidgetDetailConfig,
  WidgetDetailData,
  WidgetDetailSeriesPoint,
} from '../models/widget-detail.model';
import type {WidgetChartConfig} from '../models/widget-chart-config.model';
import type {WidgetCatalogEntry, WidgetsCatalog} from '../models/widget-catalog.model';
import type {
  WidgetApiResponse,
  WidgetApiData,
  WidgetApiSeries,
  WidgetApiSeriesPoint,
  WidgetApiFilter,
  WidgetApiCompareIndicator,
} from '../models/widget-api-response.model';
import {DashboardDataService} from './dashboard-data.service';

interface WidgetDetailConfigCache {
  configMap: Map<string, WidgetDetailConfig>;
  filterMap: Partial<Record<string, FilterConfig[]>>;
}

@Injectable({providedIn: 'root'})
export class WidgetDetailConfigService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly catalog$ = this.http
    .get<WidgetsCatalog>(`${this.baseUrl}/widgets-catalog.json`)
    .pipe(shareReplay(1));

  readonly allConfigs$: Observable<WidgetDetailConfigCache> = this.catalog$.pipe(
    switchMap(catalog => {
      const entries = catalog.widgets.filter(w => w.hasDetailView);
      if (entries.length === 0) return of({configMap: new Map(), filterMap: {}});

      return forkJoin(
        entries.map(w =>
          this.http.get<WidgetApiResponse>(`${this.baseUrl}/${this.idToFileName(w)}`).pipe(
            map(response => ({id: w.id, response})),
            catchError(() => of(null)),
          ),
        ),
      ).pipe(
        map(results => {
          const configMap = new Map<string, WidgetDetailConfig>();
          const filterMap: Partial<Record<string, FilterConfig[]>> = {};

          for (const result of results) {
            if (!result) continue;
            const {id, response} = result;
            configMap.set(id, this.buildConfig(response));
            const filters = this.buildFilters(response);
            if (filters.length) filterMap[id] = filters;
          }

          return {configMap, filterMap};
        }),
      );
    }),
    shareReplay(1),
  );

  private idToFileName(w: WidgetCatalogEntry): string {
    return w.id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) + '.json';
  }

  // ---------------------------------------------------------------------------
  // Builders
  // ---------------------------------------------------------------------------

  private buildConfig(response: WidgetApiResponse): WidgetDetailConfig {
    const d          = response.data;
    const viz        = d.visualizations?.[0];
    const unit       = d.unit ?? '';
    const isPercent  = unit.includes('%');
    const hasForecast = d.type === 'forecast';
    const hasCompare  = d.compare === true;

    const allActualSeries = (viz?.series ?? []).filter((s: WidgetApiSeries) => !s.isForecast);
    const primarySeries   = allActualSeries.find((s: WidgetApiSeries) => s.group === 'total')
      ?? (allActualSeries.length === 1 ? allActualSeries[0] : undefined);

    const isStacked = viz?.stacking === 'normal' || viz?.stacking === 'percent';
    const chartType = isStacked ? 'stacked-bar' : (viz?.chartType ?? 'line');

    const chartConfig: WidgetChartConfig = {
      type:       chartType,
      dimensions: {width: 960, height: 428},
      ...(d.orientation ? {orientation: d.orientation} : {}),
      ...(isStacked ? {stacking: viz?.stacking as 'normal' | 'percent'} : {}),
      yAxis: {
        dynamicBounds: true,
        minPadding:    1,
        maxPadding:    3,
        ...(isPercent ? {maxCap: 100} : {}),
        tickCount:     5,
        ...(d.yAxis ?? {}),
        unit,
      },
      series: [{
        name:         d.title,
        color:        primarySeries?.color ?? '#2563EA',
        lineWidth:    2,
        markerRadius: 4,
        dataLabels:   {enabled: true, unit},
      }],
      ...(hasForecast ? {forecast: {color: '#5CC049', dashStyle: 'Dash'}} : {}),
      ...(hasCompare  ? {compare:  {dashStyle: 'ShortDash'}}             : {}),
    };

    return {
      indicatorName: d.title ?? '',
      features:      {forecast: hasForecast, compare: hasCompare},
      chartConfig,
      viewTypes:     d.viewTypes,
      loadData:      (_svc: DashboardDataService) => of(this.mapToWidgetData(response)),
    };
  }

  private buildFilters(response: WidgetApiResponse): FilterConfig[] {
    return (response.data?.filters ?? []).map((f: WidgetApiFilter) => ({
      key:     f.key,
      label:   f.label,
      options: f.options,
      type:    f.type,
    }));
  }

  private mapToWidgetData(response: WidgetApiResponse): WidgetDetailData {
    const d           = response.data;
    const viz         = d.visualizations?.[0];
    const unit        = d.unit ?? '';
    const isPercent   = unit.includes('%');
    const hasForecast = d.type === 'forecast';

    const allActualSeries = (viz?.series ?? []).filter((s: WidgetApiSeries) => !s.isForecast);
    const totalSeriesDef  = allActualSeries.find((s: WidgetApiSeries) => s.group === 'total')
      ?? (allActualSeries.length === 1 ? allActualSeries[0] : undefined);
    const hasTotalSeries  = !!totalSeriesDef;

    const firstSeries = allActualSeries[0];
    const nameKey = totalSeriesDef?.nameAccessor?.path
      ?? totalSeriesDef?.xAccessor?.path
      ?? (firstSeries?.xAccessor?.type === 'category' ? firstSeries?.xAccessor?.path : undefined)
      ?? firstSeries?.nameAccessor?.path;
    const series: WidgetDetailSeriesPoint[] = (totalSeriesDef?.data ?? []).map((p: WidgetApiSeriesPoint) => ({
      year:  (nameKey ? p[nameKey] : p.YEAR) ?? '',
      value: isPercent ? Math.round(p.VALUE * 10) / 10 : p.VALUE,
    }));

    let multiSeries: MultiSeriesItem[] | undefined;
    if (!hasTotalSeries && allActualSeries.length > 0) {
      multiSeries = allActualSeries.map((s: WidgetApiSeries) => {
        const seriesCategoryKey = s.xAccessor?.path ?? s.nameAccessor?.path;
        return {
          name:  s.label ?? '',
          color: s.color ?? '#2563EA',
          data:  (s.data ?? []).map((p: WidgetApiSeriesPoint) => ({
            year:  (seriesCategoryKey ? p[seriesCategoryKey] : p.YEAR) ?? '',
            value: isPercent ? Math.round(p.VALUE * 10) / 10 : p.VALUE,
          })),
        };
      });
    }

    let forecastSeries: WidgetDetailSeriesPoint[] | undefined;
    if (hasForecast) {
      const totalForecastDef = (viz?.series ?? []).find(
        (s: WidgetApiSeries) => s.group === 'total' && s.isForecast === true,
      );
      if (totalForecastDef) {
        const seriesYears = new Set(series.map(p => p.year));
        forecastSeries = (totalForecastDef.data ?? [])
          .filter((p: WidgetApiSeriesPoint) => !seriesYears.has(p.YEAR ?? ''))
          .map((p: WidgetApiSeriesPoint) => ({
            year:  p.YEAR ?? '',
            value: isPercent ? Math.round(p.VALUE * 10) / 10 : p.VALUE,
          }));
      }
    }

    const rangeOptions = (d.rangeOptions ?? []).map(r => ({
      id:    r.id,
      label: r.label,
      value: r.value ?? null,
    }));

    const primaryData = hasTotalSeries
      ? series
      : (multiSeries?.[0]?.data ?? []).map(p => ({year: p.year, value: p.value}));

    const first  = primaryData[0]?.year ?? '';
    const last   = primaryData[primaryData.length - 1]?.year ?? '';
    const period = first === last ? first : `${first}\u2013${last}`;

    return {
      title:           d.title ?? '',
      description:     d.description ?? '',
      securityLabel:   d.classification ? d.classification.charAt(0).toUpperCase() + d.classification.slice(1) : '',
      unit,
      dataSource:      d.dataSource ?? '',
      updatedDate:     d.updated ?? '',
      metaData:        (d.metadata ?? []).map(m => ({label: m.label, value: m.value})),
      rangeOptions,
      defaultRange:    'ALL',
      monthlyChange:   0,
      quarterlyChange: 0,
      yearlyChange:    0,
      highlights:      this.buildHighlights(primaryData, isPercent),
      period,
      series,
      multiSeries,
      forecastSeries,
      relatedSV: (d.compareIndicators ?? []).map((c: WidgetApiCompareIndicator) => ({
        id: c.id, title: c.title, note: '', title_ar: '', content_type: '',
      })),
      relatedSVMap: Object.fromEntries(
        (d.compareIndicators ?? [])
          .filter((c: WidgetApiCompareIndicator) => c.data)
          .map((c: WidgetApiCompareIndicator) => {
            const normData = (c.data ?? []).map((point: any) => ({
              YEAR:  nameKey ? point[nameKey] : (point.YEAR ?? ''),
              VALUE: point.VALUE,
            }));
            return [c.id, {title: c.title, data: normData}];
          }),
      ),
      forecastRelatedSVMap: Object.fromEntries(
        (d.compareIndicators ?? [])
          .filter((c: WidgetApiCompareIndicator) => c.forecast?.length)
          .map((c: WidgetApiCompareIndicator) => [c.id, c.forecast!]),
      ),
      aiRecommendation: d.aiRecommendation ? {
        badge:     d.aiRecommendation.badge,
        badge_ar:  d.aiRecommendation.badge_ar,
        title:     d.aiRecommendation.title,
        title_ar:  d.aiRecommendation.title_ar,
        text:      d.aiRecommendation.text,
        text_ar:   d.aiRecommendation.text_ar,
        reason:    d.aiRecommendation.reason,
        reason_ar: d.aiRecommendation.reason_ar,
      } : undefined,
    };
  }

  private buildHighlights(
    series: WidgetDetailSeriesPoint[],
    isPercent: boolean,
  ): {label: string; value: string}[] {
    if (series.length === 0) return [];

    const format = (v: number) =>
      isPercent ? `${v}%` : v.toLocaleString('en-US');

    const latest = series[series.length - 1];
    const label0 = isPercent ? 'Current Rate' : 'Latest Value';

    const result: {label: string; value: string}[] = [
      {label: `${label0} (${latest.year})`, value: format(latest.value)},
    ];

    if (series.length >= 2) {
      const previous = series[series.length - 2];
      const change   = isPercent
        ? Math.round((latest.value - previous.value) * 10) / 10
        : latest.value - previous.value;
      const sign = change > 0 ? '+' : '';
      result.push({label: 'Change vs Last Year', value: `${sign}${format(change)}`});
    }

    if (series.length >= 2) {
      const earliest = series[0];
      const growth   = isPercent
        ? Math.round((latest.value - earliest.value) * 10) / 10
        : latest.value - earliest.value;
      const years = parseInt(latest.year, 10) - parseInt(earliest.year, 10);
      const sign  = growth > 0 ? '+' : '';
      result.push({label: `${years}-Year Historical Growth`, value: `${sign}${format(growth)}`});
    }

    return result;
  }
}
