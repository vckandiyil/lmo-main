import type {WidgetChartConfig} from './widget-chart-config.model';

export interface DataLoaderConfig {
  /** Inline indicator data embedded directly in the widget config JSON. */
  inlineData?: any;
  /** Inline forecast data embedded directly in the widget config JSON. */
  forecastInlineData?: any;
  /** Path (relative to server-api-jsons/) to load indicator data from a separate JSON file. */
  dataFile?: string;
}

export interface ViewTypeConfig {
  id: string;
  label: string;
  icon: string;
  default?: boolean;
}

export interface CompareIndicatorConfig {
  id: string;
  title: string;
}

/** Mirrors FilterConfig from filter-bar — kept separate to avoid cross-layer imports */
export interface FilterByConfig {
  key: string;
  label: string;
  type: 'radio' | 'checkbox';
  options: string[];
}

export interface AiRecommendationJsonConfig {
  badge?: string;
  badge_ar?: string;
  title: string;
  title_ar?: string;
  text: string;
  text_ar?: string;
  reason: string;
  reason_ar?: string;
}

export interface WidgetDetailJsonConfig {
  indicatorName: string;
  dataLoader: DataLoaderConfig;
  features?: { forecast?: boolean; compare?: boolean };
  viewTypes?: ViewTypeConfig[];
  compareIndicators?: CompareIndicatorConfig[];
  filterBy?: FilterByConfig[];
  chartConfig?: WidgetChartConfig;
  aiRecommendation?: AiRecommendationJsonConfig;
}
