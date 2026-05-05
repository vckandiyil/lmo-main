export interface HeroBriefItem {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  titleLink: boolean;
}

export interface HeroSignal {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  sparkData: number[];
  sparkColor: string;
  sparkFill: string;
  delta: string;
  deltaVariant: 'badge-success' | 'text-warning';
}

export interface HeroKpiCard {
  icon: string;
  delta: string;
  trend: 'up' | 'down';
  value: string;
  label: string;
  previous: string;
}
