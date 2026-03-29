import {Observable} from 'rxjs';
import type {DashboardDataService} from '../services/dashboard-data.service';
import type {MetaDataItem, RelatedSV, RelatedSVMap, ForecastRelatedSVMap} from '../services/dashboard-data.service';
import type {WidgetChartConfig} from './widget-chart-config.model';
import type {ViewTypeConfig} from './widget-detail-json.model';

export interface WidgetDetailSeriesPoint {
  year: string;
  value: number;
}

export interface MultiSeriesItem {
  name: string;
  color: string;
  data: WidgetDetailSeriesPoint[];
}

export interface ChartBuildContext {
  forecastEnabled: boolean;
  forecastSeries: WidgetDetailSeriesPoint[];
  selectedCompareItems: {id: string; title: string; color: string}[];
  relatedSVMap: RelatedSVMap;
  forecastRelatedSVMap: ForecastRelatedSVMap;
  showTooltip?: boolean;
  showDataLabels?: boolean;
  showPreciseValue?: boolean;
  multiSeries?: MultiSeriesItem[];
}

export interface WidgetDetailData {
  title: string;
  description: string;
  securityLabel: string;
  unit: string;
  dataSource: string;
  updatedDate: string;
  metaData: MetaDataItem[];
  rangeOptions: { id: string; label: string; value: number | null }[];
  defaultRange: string;
  monthlyChange: number;
  quarterlyChange: number;
  yearlyChange: number;
  highlights: { label: string; value: string }[];
  period: string;
  series: WidgetDetailSeriesPoint[];
  forecastSeries?: WidgetDetailSeriesPoint[];
  multiSeries?: MultiSeriesItem[];
  relatedSV?: RelatedSV[];
  relatedSVMap?: RelatedSVMap;
  forecastRelatedSVMap?: ForecastRelatedSVMap;
  aiRecommendation?: {
    badge?: string;
    badge_ar?: string;
    title: string;
    title_ar?: string;
    text: string;
    text_ar?: string;
    reason: string;
    reason_ar?: string;
  };
}

export interface WidgetDetailFeatures {
  forecast?: boolean;
  compare?: boolean;
}

export interface WidgetDetailConfig {
  indicatorName: string;
  features?: WidgetDetailFeatures;
  /** JSON-driven chart config — used by ChartBuilderService instead of a per-widget buildChartOptions() */
  chartConfig?: WidgetChartConfig;
  /** Available chart-type switcher entries from widgets-detail-config.json `viewTypes` */
  viewTypes?: ViewTypeConfig[];
  settingsTabs?: { id: string; icon: string; label: string; description?: string }[];
  downloadFormats?: { id: string; label: string; icon: string; color: string; iconColor: string }[];
  shareFormats?: { id: string; label: string; icon: string }[];
  loadData(svc: DashboardDataService): Observable<WidgetDetailData>;
}
