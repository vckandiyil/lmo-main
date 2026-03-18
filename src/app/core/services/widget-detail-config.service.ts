import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {API_BASE_URL} from '../tokens/api-base-url.token';
import {forkJoin, map, Observable, of, shareReplay} from 'rxjs';
import type {DataLoaderConfig, FilterByConfig, WidgetDetailJsonConfig} from '../models/widget-detail-json.model';
import type {WidgetChartConfig} from '../models/widget-chart-config.model';
import type {WidgetType} from '../models/widget.model';
import type {
  ForecastDataPoint,
  ForecastRelatedSVMap,
  OverviewValueMeta,
  RelatedSVMap,
  VisualizationMeta,
} from './dashboard-data.service';
import {DashboardDataService} from './dashboard-data.service';
import type {FilterConfig} from '../../components/molecule/filter-bar/filter-bar';
import type {
  WidgetDetailConfig,
  WidgetDetailData,
  WidgetDetailSeriesPoint,
} from '../models/widget-detail.model';

interface WidgetDetailConfigCache {
  configMap: Map<string, WidgetDetailConfig>;
  filterMap: Partial<Record<string, FilterConfig[]>>;
}

@Injectable({providedIn: 'root'})
export class WidgetDetailConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly dashboardDataService = inject(DashboardDataService);

  private readonly json$ = forkJoin({
    config: this.http.get<Record<string, WidgetDetailJsonConfig>>(`${this.baseUrl}/widgets-detail-config.json`),
    unemployment: this.http.get<Record<string, WidgetDetailJsonConfig>>(`${this.baseUrl}/unemployment.json`),
  }).pipe(
    map(({config, unemployment}) => ({...config, ...unemployment})),
    shareReplay(1),
  );

  readonly allConfigs$: Observable<WidgetDetailConfigCache> = this.json$.pipe(
    map(json => ({
      configMap: this.buildConfigMap(json),
      filterMap: this.buildFilterMap(json),
    })),
    shareReplay(1),
  );

  // ---------------------------------------------------------------------------
  // Private builders
  // ---------------------------------------------------------------------------

  private buildConfigMap(json: Record<string, WidgetDetailJsonConfig>): Map<string, WidgetDetailConfig> {
    const map = new Map<string, WidgetDetailConfig>();
    for (const [id, entry] of Object.entries(json)) {
      map.set(id, this.buildConfig(entry));
    }
    return map;
  }

  private buildFilterMap(json: Record<string, WidgetDetailJsonConfig>): Partial<Record<string, FilterConfig[]>> {
    const result: Partial<Record<string, FilterConfig[]>> = {};
    for (const [id, entry] of Object.entries(json)) {
      if (entry.filterBy && entry.filterBy.length > 0) {
        result[id] = entry.filterBy.map(f => this.toFilterConfig(f));
      }
    }
    return result;
  }

  private buildConfig(entry: WidgetDetailJsonConfig): WidgetDetailConfig {
    const svc               = this.dashboardDataService;
    const dataLoader        = entry.dataLoader;
    const aiRec             = entry.aiRecommendation;
    const chartConfig       = entry.chartConfig;
    const compareIndicators = entry.compareIndicators;
    const viewTypes         = entry.viewTypes;

    return {
      indicatorName: entry.indicatorName,
      features:      entry.features,
      chartConfig:   chartConfig as WidgetChartConfig | undefined,
      viewTypes,
      loadData:      (_svc: DashboardDataService) =>
        this.loadDataGeneric(dataLoader, svc, aiRec, compareIndicators),
    };
  }

  private loadDataGeneric(
    dataLoader: DataLoaderConfig,
    _svc: DashboardDataService,
    aiRecommendation?: WidgetDetailJsonConfig['aiRecommendation'],
    compareIndicators?: WidgetDetailJsonConfig['compareIndicators'],
  ): Observable<WidgetDetailData> {
    const primaryObs = dataLoader.dataFile
      ? this.http.get<any>(`${this.baseUrl}/${dataLoader.dataFile}`)
      : of(dataLoader.inlineData);

    const observables: Record<string, Observable<any>> = {
      primary: primaryObs,
    };

    if (dataLoader.forecastInlineData) observables['forecast'] = of(dataLoader.forecastInlineData);

    return forkJoin(observables).pipe(
      map(results => this.mapScadToWidgetData(results, dataLoader, aiRecommendation, compareIndicators)),
    );
  }

  private mapScadToWidgetData(
    results: Record<string, any>,
    _dataLoader: DataLoaderConfig,
    aiRecommendation?: WidgetDetailJsonConfig['aiRecommendation'],
    compareIndicators?: WidgetDetailJsonConfig['compareIndicators'],
  ): WidgetDetailData {
    const primary  = results['primary'];
    const viz: VisualizationMeta = primary.indicatorVisualizations.visualizationsMeta[0];
    const isPercent = (primary.unit as string | undefined)?.includes('%') ?? false;

    const series: WidgetDetailSeriesPoint[] = viz.seriesMeta[0].data.map(d => ({
      year:  d.YEAR,
      value: isPercent ? Math.round(d.VALUE * 10) / 10 : d.VALUE,
    }));

    const first  = series[0]?.year ?? '';
    const last   = series[series.length - 1]?.year ?? '';
    const period = first === last ? first : `${first}\u2013${last}`;

    const filters     = viz.indicatorFilters?.[0]?.options ?? primary.indicatorFilters?.[0]?.options ?? [];
    const rangeOptions = filters.map((f: any) => ({
      id:    f.id,
      label: f.value != null ? `${f.value}Y` : f.label,
      value: f.value,
    }));

    const overview: OverviewValueMeta | undefined = primary.indicatorValues?.overviewValuesMeta?.[0];

    // Build forecast series (exclude years already in the main series)
    const forecastRaw: ForecastDataPoint[] | undefined = results['forecast'];
    let forecastSeries: WidgetDetailSeriesPoint[] | undefined;
    if (forecastRaw) {
      const seriesYears = new Set(series.map(d => d.year));
      forecastSeries = forecastRaw
        .filter(d => !seriesYears.has(d.YEAR))
        .map(d => ({
          year:  d.YEAR,
          value: isPercent ? Math.round(d.VALUE * 10) / 10 : d.VALUE,
        }));
    }

    const relatedSVMap: RelatedSVMap | undefined           = results['relatedSV'];
    const forecastRelatedSVMap: ForecastRelatedSVMap | undefined = results['forecastRelatedSV'];

    return {
      title:           primary.component_title,
      description:     primary.component_subtitle,
      securityLabel:   primary.security?.label ?? '',
      unit:            primary.unit ?? '',
      dataSource:      primary.data_source ?? '',
      updatedDate:     primary.updated ?? '',
      metaData:        primary.metaData ?? [],
      rangeOptions,
      defaultRange:    'ALL',
      monthlyChange:   isPercent
                         ? Math.round((overview?.monthlyChangeValue ?? 0) * 10) / 10
                         : (overview?.monthlyChangeValue ?? 0),
      quarterlyChange: isPercent
                         ? Math.round((overview?.quarterlyChangeValue ?? 0) * 10) / 10
                         : (overview?.quarterlyChangeValue ?? 0),
      yearlyChange:    isPercent
                         ? Math.round((overview?.yearlyChangeValue ?? 0) * 10) / 10
                         : (overview?.yearlyChangeValue ?? 0),
      highlights:      this.buildHighlights(series, isPercent),
      period,
      series,
      forecastSeries,
      // Use API-provided relatedSV; fall back to compareIndicators from JSON config
      relatedSV: viz.relatedSV?.length
        ? viz.relatedSV
        : (compareIndicators ?? []).map(c => ({
            id: c.id, title: c.title, note: '', title_ar: '', content_type: '',
          })),
      relatedSVMap,
      forecastRelatedSVMap,
      aiRecommendation: aiRecommendation
        ? {
            badge: aiRecommendation.badge, badge_ar: aiRecommendation.badge_ar,
            title: aiRecommendation.title, title_ar: aiRecommendation.title_ar,
            text: aiRecommendation.text, text_ar: aiRecommendation.text_ar,
            reason: aiRecommendation.reason, reason_ar: aiRecommendation.reason_ar,
          }
        : undefined,
    };
  }

  private buildHighlights(series: WidgetDetailSeriesPoint[], isPercent: boolean): {label: string; value: string}[] {
    if (series.length === 0) return [];

    const format = (v: number) =>
      isPercent ? `${v}%` : v.toLocaleString('en-US');

    const latest   = series[series.length - 1];
    const label0   = isPercent ? 'Current Employment' : 'Current Population';
    const result: {label: string; value: string}[] = [
      {label: `${label0} (${latest.year})`, value: format(latest.value)},
    ];

    if (series.length >= 2) {
      const previous = series[series.length - 2];
      const change   = isPercent
        ? Math.round((latest.value - previous.value) * 10) / 10
        : latest.value - previous.value;
      const sign     = change > 0 ? '+' : '';
      result.push({label: 'Change vs Last Year', value: `${sign}${format(change)}`});
    }

    if (series.length >= 2) {
      const earliest = series[0];
      const growth   = isPercent
        ? Math.round((latest.value - earliest.value) * 10) / 10
        : latest.value - earliest.value;
      const years    = parseInt(latest.year, 10) - parseInt(earliest.year, 10);
      const sign     = growth > 0 ? '+' : '';
      result.push({label: `${years}-Year Historical Growth`, value: `${sign}${format(growth)}`});
    }

    return result;
  }

  private toFilterConfig(f: FilterByConfig): FilterConfig {
    return {key: f.key, label: f.label, options: f.options, type: f.type};
  }
}
