/**
 * Barrel export for all widget components.
 * Centralizes widget imports for cleaner consumer code.
 */

import { WidgetType } from '../../../core/models/widget.model';
import { MarketEntrants } from '../market-entrants/market-entrants';
import { LaborForceComposition } from '../labor-force-composition/labor-force-composition';
import { SectorGapsOpportunities } from '../sector-gaps-opportunities/sector-gaps-opportunities';
import { WorkforceStructure } from '../workforce-structure/workforce-structure';
import { EmploymentRateTrend } from '../employment-rate-trend/employment-rate-trend';
import { Employment } from '../employment/employment';
import { AiInsights } from '../ai-insights/ai-insights';
import { RegionProfile } from '../region-profile/region-profile';
import { MaritalActivityStatus } from '../marital-activity-status/marital-activity-status';
import { GapAnalysisWidget } from '../supply-and-demand-widget/supply-and-demand-widget';

export {
  MarketEntrants,
  LaborForceComposition,
  SectorGapsOpportunities,
  WorkforceStructure,
  EmploymentRateTrend,
  Employment,
  AiInsights,
  RegionProfile,
  MaritalActivityStatus,
  GapAnalysisWidget,
};

/**
 * Custom widget components — widgets with unique UI that cannot be driven by JSON alone.
 * Standard line-chart widgets (employment-rate, unemployment-rate, population-number, etc.)
 * are rendered via GenericWidgetCard and do not appear here.
 */
export const ALL_WIDGET_COMPONENTS = [
  MarketEntrants,
  LaborForceComposition,
  SectorGapsOpportunities,
  WorkforceStructure,
  EmploymentRateTrend,
  Employment,
  AiInsights,
  RegionProfile,
  MaritalActivityStatus,
  GapAnalysisWidget,
] as const;

/**
 * Mapping from WidgetType to a custom Component class.
 * Only widgets that cannot be driven by GenericWidgetCard live here.
 * Any widget type NOT in this map is rendered via GenericWidgetCard automatically.
 */
export const WIDGET_COMPONENT_MAP: Partial<Record<WidgetType, any>> = {
  [WidgetType.MarketEntrants]: MarketEntrants,
  [WidgetType.LaborForceComposition]: LaborForceComposition,
  [WidgetType.SectorGapsOpportunities]: SectorGapsOpportunities,
  [WidgetType.WorkforceStructure]: WorkforceStructure,
  [WidgetType.EmploymentRateTrend]: EmploymentRateTrend,
  [WidgetType.Employment]: Employment,
  [WidgetType.AiInsights]: AiInsights,
  [WidgetType.RegionProfile]: RegionProfile,
  [WidgetType.MaritalActivityStatus]: MaritalActivityStatus,
  [WidgetType.GapAnalysis]: GapAnalysisWidget,
};
