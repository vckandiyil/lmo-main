export interface WidgetYAxisConfig {
  dynamicBounds?: boolean;
  /** Fixed units subtracted from min value */
  minPadding?: number;
  /** Fixed units added to max value */
  maxPadding?: number;
  /** Cap the max at this value (e.g. 100 for percentages) */
  maxCap?: number;
  /** Fractional padding as a ratio of the data range (e.g. 0.1 = 10%) */
  paddingFactor?: number;
  /** Snap y-axis bounds to the nearest multiple of this value (e.g. 100000) */
  snapTo?: number;
  tickCount?: number;
  /** Unit suffix for data labels (e.g. '%') */
  unit?: string;
}

export interface WidgetDataLabelsConfig {
  enabled?: boolean;
  /** Unit suffix appended to each label (e.g. '%') */
  unit?: string;
}

export interface WidgetSeriesConfig {
  name: string;
  color: string;
  lineWidth?: number;
  markerRadius?: number;
  dataLabels?: WidgetDataLabelsConfig;
}

export interface WidgetChartConfig {
  type: string;
  dimensions?: { width?: number; height?: number };
  yAxis?: WidgetYAxisConfig;
  series?: WidgetSeriesConfig[];
  forecast?: { color?: string; dashStyle?: string };
  compare?: { dashStyle?: string };
}
