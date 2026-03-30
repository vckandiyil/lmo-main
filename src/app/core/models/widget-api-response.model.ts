import type {ViewTypeConfig, AiRecommendationJsonConfig} from './widget-detail-json.model';

export interface WidgetApiSeriesPoint {
  VALUE: number;
  OBS_DT?: string;
  YEAR?: string;
  [key: string]: any;
}

export interface WidgetApiSeries {
  id: string;
  type: string;
  color: string;
  group: string;
  label: string;
  data: WidgetApiSeriesPoint[];
  isForecast?: boolean;
  xAccessor?: {path: string; type: string};
  nameAccessor?: {path: string; type: string};
}

export interface WidgetApiVisualization {
  label: string;
  series: WidgetApiSeries[];
  chartType: string;
  stacking?: string;
  valueFormat: string;
  isTimeSeries: boolean;
}

export interface WidgetApiFilter {
  key: string;
  label: string;
  type: 'radio' | 'checkbox';
  options: string[];
}

export interface WidgetApiCompareIndicator {
  id: string;
  title: string;
  data?: {YEAR: string; VALUE: number}[];
  forecast?: {YEAR: string; VALUE: number}[];
}

export interface WidgetApiYAxis {
  paddingFactor?: number;
  snapTo?: number;
  maxCap?: number;
  minPadding?: number;
  maxPadding?: number;
}

export interface WidgetApiData {
  id: string | number;
  title: string;
  type: string;
  compare: boolean;
  unit: string;
  filters: WidgetApiFilter[];
  updated: string;
  category: string;
  metadata: {label: string; value: string}[];
  dataSource: string;
  classification?: string;
  description: string;
  compareIndicators: WidgetApiCompareIndicator[];
  aiRecommendation?: AiRecommendationJsonConfig;
  visualizations: WidgetApiVisualization[];
  rangeOptions: {id: string; label: string; value: number | null}[];
  viewTypes?: ViewTypeConfig[];
  orientation?: 'horizontal';
  yAxis?: WidgetApiYAxis;
}

export interface WidgetApiResponse {
  success: boolean;
  correlationId: string;
  message: string;
  data: WidgetApiData;
}
