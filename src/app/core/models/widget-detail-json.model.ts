export interface ViewTypeConfig {
  id: string;
  label: string;
  icon: string;
  default?: boolean;
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
