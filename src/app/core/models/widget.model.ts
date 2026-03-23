/**
 * Enum of all available widget types in the application.
 */
export enum WidgetType {
  MarketEntrants = 'market-entrants',
  LaborForceComposition = 'labor-force-composition',
  SectorGapsOpportunities = 'sector-gaps-opportunities',
  UnemploymentRate = 'unemployment-rate',
  WorkforceStructure = 'workforce-structure',
  EmploymentRate = 'employment-rate',
  EmploymentRateTrend = 'employment-rate-trend',
  Employment = 'employment',
  AiInsights = 'ai-insights',
  RegionProfile = 'region-profile',
  MaritalActivityStatus = 'marital-activity-status',
  PopulationNumber = 'population-number',
  GapAnalysis = 'supply-and-demand',
  Map = 'map'
}

/**
 * Widget identifier type.
 * Uses the widget type value as a stable identifier for persistence.
 */
export type WidgetIdentifier = `widget-${WidgetType}`;

/**
 * Creates a stable widget identifier from a widget type.
 * @param type - The widget type
 * @returns A unique, stable identifier for the widget
 */
export function createWidgetId(type: WidgetType): WidgetIdentifier {
  return `widget-${type}`;
}

/**
 * Widget configuration interface.
 * Represents a widget instance in a sidebar.
 */
export interface Widget {
  id: WidgetIdentifier;
  type: WidgetType;
}

/**
 * Sidebar identifier type.
 */
export type SidebarPosition = 'left' | 'right';
