export interface AiOverviewSource {
  name: string;
  url: string;
}

export interface AiOverviewDataItem {
  label: string;
  value: string;
}

export interface AiOverviewDataSection {
  title: string;
  source: AiOverviewSource;
  items: AiOverviewDataItem[];
}

export interface AiOverviewSummary {
  text: string;
  highlights: string[];
}

export interface AiOverview {
  summary: AiOverviewSummary;
  dataSection: AiOverviewDataSection;
}

export interface AiOverviewResponse {
  aiOverview: AiOverview;
}
