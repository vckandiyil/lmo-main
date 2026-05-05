import {Component, OnDestroy, OnInit, computed, signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {Filters} from '../../components/organism/filters/filters';
import {LmiBar} from '../../components/organism/lmi-bar/lmi-bar';
import {Icon} from '../../components/atom/icon/icon';
import {Badge} from '../../components/atom/badge/badge';
import {InlineSvg} from '../../components/atom/inline-svg/inline-svg';
import {ChartWrapper} from '../../components/molecule/chart-wrapper/chart-wrapper';
import {HomeHero} from './components/organism/home-hero/home-hero';
import type {HeroBriefItem, HeroKpiCard, HeroSignal} from './components/organism/home-hero/types';
import type {ChartOptions} from '../../shared/services/chart-config.service';

interface KpiRow {
  icon: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  reference: string;
}

type RegionId = 'abu-dhabi' | 'al-ain' | 'al-dhafra';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Filters, LmiBar, Icon, Badge, InlineSvg, ChartWrapper, HomeHero, TranslateModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage implements OnInit, OnDestroy {
  private insightTimer: ReturnType<typeof setInterval> | null = null;
  private static readonly INSIGHT_ROTATION_MS = 3000;

  protected readonly kpis = signal<KpiRow[]>([
    {icon: 'user', label: 'Employment Rate',           value: '78%',    delta: '+0.8pp', trend: 'up',   reference: 'vs Q1 2024'},
    {icon: 'large-suitcase',                 label: 'Unemployment Rate',         value: '3.8%',   delta: '-0.3pp', trend: 'down', reference: 'vs Q1 2024'},
    {icon: 'group',             label: 'Labour Force Participation Rate', value: '83.5%', delta: '+1.2pp', trend: 'up', reference: 'vs Q1 2024'},
    {icon: 'stat-up',          label: 'Employment Growth (YoY)',   value: '+2.1%',  delta: '+0.6pp', trend: 'up',   reference: 'vs Q1 2024'},
    {icon: 'Group_light',         label: 'Labour Force Size',         value: '2.98M',  delta: '+62k',   trend: 'up',   reference: 'vs Q1 2024'},
  ]);

  protected readonly selectedRegion = signal<RegionId>('abu-dhabi');

  protected readonly mapInsights = signal<string[]>([
    'Employment is strongest in Abu Dhabi region, while Al Dhafra shows lower participation rates.',
    'Labor force participation in Al Dhafra is at 54.1%, the lowest among Abu Dhabi regions.',
    'Al Ain shows steady employment growth, with public-sector roles leading the gains.'
  ]);
  protected readonly activeInsightIndex = signal<number>(0);
  protected readonly mapInsight = computed(() => this.mapInsights()[this.activeInsightIndex()]);

  protected isRegionSelected(id: RegionId): boolean {
    return this.selectedRegion() === id;
  }

  protected selectRegion(id: RegionId): void {
    this.selectedRegion.set(id);
  }

  protected selectInsight(index: number): void {
    this.activeInsightIndex.set(index);
  }

  ngOnInit(): void {
    this.startInsightRotation();
  }

  ngOnDestroy(): void {
    this.stopInsightRotation();
  }

  protected pauseInsightRotation(): void {
    this.stopInsightRotation();
  }

  protected resumeInsightRotation(): void {
    this.startInsightRotation();
  }

  private startInsightRotation(): void {
    if (this.insightTimer !== null) return;
    this.insightTimer = setInterval(() => {
      const total = this.mapInsights().length;
      if (total === 0) return;
      this.activeInsightIndex.update(i => (i + 1) % total);
    }, HomePage.INSIGHT_ROTATION_MS);
  }

  private stopInsightRotation(): void {
    if (this.insightTimer === null) return;
    clearInterval(this.insightTimer);
    this.insightTimer = null;
  }

  // ----- Workforce Structure data -----
  protected readonly workforceStats = signal([
    {icon: 'user', label: 'Workforce size', value: '2.76M', caption: 'Total Employed'},
    {icon: 'Group_light',                label: 'Working Population', value: '4.13M', caption: '15+ years'},
  ]);

  protected readonly ageBuckets = signal([
    {label: '15-24', value: 10, color: '#2563EA'},
    {label: '25-34', value: 28, color: '#5E9BDD'},
    {label: '35-44', value: 36, color: '#58B799'},
    {label: '45-54', value: 18, color: '#FAC656'},
    {label: '55+',   value:  8, color: '#F33990'},
  ]);

  protected readonly citizenshipLegend = signal([
    {value: '93.2%', label: 'Expat',   color: '#58B799'},
    {value: '6.8%',  label: 'Emirati', color: '#2563EA'},
  ]);

  protected readonly genderLegend = signal([
    {value: '78%', label: 'Male',   color: '#2773D1'},
    {value: '22%', label: 'Female', color: '#F33990'},
  ]);

  // ----- Findings filter -----
  protected readonly findingsFilters = signal<string[]>(['All', 'Positive', 'Neutral', 'Negative']);
  protected readonly activeFinding = signal<string>('All');

  protected selectFinding(filter: string): void {
    this.activeFinding.set(filter);
  }

  // ----- Policy filter -----
  protected readonly policyFilters = signal<string[]>(['All', 'Policy', 'Economy', 'External']);
  protected readonly activePolicy = signal<string>('All');

  protected selectPolicy(filter: string): void {
    this.activePolicy.set(filter);
  }

  // ----- Hero brief items -----
  protected readonly heroBrief = signal<HeroBriefItem[]>([
    {
      icon: 'trending-up',
      iconColor: '#5CC049',
      iconBg: '#EEF7F4',
      title: 'Employment remains strong (+0.8%)',
      description: 'Growth is driven by construction, healthcare, and professional services sectors.',
      titleLink: false,
    },
    {
      icon: 'info-empty',
      iconColor: '#FAC656',
      iconBg: '#FFF7E6',
      title: 'AI skills shortage continues to pressure hiring timelines',
      description: 'Highest impact in ICT and data-related roles across Abu Dhabi region.',
      titleLink: false,
    },
    {
      icon: 'Group_light',
      iconColor: '#3375C6',
      iconBg: '#E8F0F9',
      title: 'Private sector Emiratisation shows steady progress (+0.6%)',
      description: 'Participation improving, but gaps remain across sectors and regions.',
      titleLink: false,
    },
  ]);

  // ----- Hero floating KPI cards -----
  protected readonly heroFloatingCards = signal<HeroKpiCard[]>([
    {
      icon: 'trending-up',
      delta: '+1.4%',
      trend: 'up' as const,
      value: '96.2%',
      label: 'Employment Rate',
      previous: '95.4%',
    },
    {
      icon: 'group',
      delta: '+3.2%',
      trend: 'up' as const,
      value: '1.82M',
      label: 'Workforce Size',
      previous: '1.79M',
    },
    {
      icon: 'shield',
      delta: '+2.1%',
      trend: 'up' as const,
      value: '42.8%',
      label: 'Emiratization',
      previous: '42.2%',
    },
    {
      icon: 'stats-up-square',
      delta: '+1.3%',
      trend: 'up' as const,
      value: '7.3%',
      label: 'Sector Growth',
      previous: '7.1%',
    },
    {
      icon: 'stat-down',
      delta: '-0.6%',
      trend: 'down' as const,
      value: '3.8%',
      label: 'Unemployment',
      previous: '4.1%',
    },
  ]);

  // ----- Policy timeline cards -----
  protected readonly policies = signal([
    {
      year: '2026',
      status: 'Upcoming',
      statusColor: '#58B799',
      category: 'Policy',
      categoryColor: '#58B799',
      leftIcon: 'Group_light',
      title: 'Private Sector Emiratisation Acceleration Programme',
      description: 'Incentivizing private sector hiring of Emirates through targeted support and partnerships.',
      impactText: 'High Positive Impact',
      impactIcon: 'arrow-up',
      impactColor: '#58B799',
      impactBg: '#EEF7F4',
      impactDetail: 'Expected to increase private sector Emirati employment by 5-7%.',
      kpis: [
        {label: 'Employment Rate',    delta: '+1.1%', trend: 'up' as 'up' | 'down'},
        {label: 'Participation Rate', delta: '+1.3%', trend: 'up' as 'up' | 'down'},
        {label: 'Emiratization Rate', delta: '+0.9%', trend: 'up' as 'up' | 'down'},
      ],
      focusAreas: ['Workforce Participation', 'Private Sector Growth'],
    },
    {
      year: '2025',
      status: 'Implemented',
      statusColor: '#3375C6',
      category: 'Policy',
      categoryColor: '#3375C6',
      leftIcon: 'graduation-cap',
      title: 'Enhanced Training Programme',
      description: 'Advanced training in high-demand skills with industry-aligned curricula.',
      impactText: 'High Positive Impact',
      impactIcon: 'arrow-up',
      impactColor: '#3375C6',
      impactBg: '#EAF1F9',
      impactDetail: '3,200 participants with 78% completion rate.',
      kpis: [
        {label: 'Employment Rate',    delta: '+1.4%', trend: 'up' as 'up' | 'down'},
        {label: 'Participation Rate', delta: '+1.2%', trend: 'up' as 'up' | 'down'},
        {label: 'AI Skills Supply',   delta: '+2.1%', trend: 'up' as 'up' | 'down'},
      ],
      focusAreas: ['Skills Development', 'Youth Employment'],
    },
    {
      year: '2024',
      status: 'Implemented',
      statusColor: '#807DFE',
      category: 'Policy',
      categoryColor: '#807DFE',
      leftIcon: 'wallet',
      title: 'Emirati Wage Growth Initiative',
      description: 'Improving competitiveness of Emirati salaries in priority sectors.',
      impactText: 'Positive Impact',
      impactIcon: 'arrow-up',
      impactColor: '#807DFE',
      impactBg: '#EFEEFE',
      impactDetail: 'Emirati wage growth outpaced overall market at 6.2% vs 4.7%.',
      kpis: [
        {label: 'Employment Rate',  delta: '+0.8%', trend: 'up' as 'up' | 'down'},
        {label: 'Retention Rate',   delta: '+1.5%', trend: 'up' as 'up' | 'down'},
        {label: 'Compensation Gap', delta: '-0.6%', trend: 'down' as 'up' | 'down'},
      ],
      focusAreas: ['Compensation', 'Private Sector'],
    },
    {
      year: '2023',
      status: 'Implemented',
      statusColor: '#E3A51F',
      category: 'Policy',
      categoryColor: '#E3A51F',
      leftIcon: 'building',
      title: 'Private Sector Representation Enhancement',
      description: 'Increasing Emirati representation in private sector, with focus on tech and finance.',
      impactText: 'Moderate Positive Impact',
      impactIcon: 'arrow-up',
      impactColor: '#E3A51F',
      impactBg: '#FCF7EB',
      impactDetail: 'Improved representation in targeted high-growth sectors.',
      kpis: [
        {label: 'Emiratization Rate', delta: '+0.6%', trend: 'up' as 'up' | 'down'},
        {label: 'Participation Rate', delta: '+0.5%', trend: 'up' as 'up' | 'down'},
        {label: 'Sector Diversity',   delta: '+1.0%', trend: 'up' as 'up' | 'down'},
      ],
      focusAreas: ['Private Sector Growth', 'Technology & Finance'],
    },
  ]);

  // ----- News cards -----
  protected readonly news = signal([
    {
      logo: 'assets/images/logos/reuters.png',
      time: '1h ago',
      sentiment: 'positive' as 'positive' | 'watch' | 'info',
      title: 'GCC labour reforms accelerate intra-region mobility',
      description: 'New mutual-recognition agreements lower friction for skilled workers across the GCC, with UAE expected to attract a net 18k professionals over 12 months.',
      takeaway: 'Net positive for the AD talent pool — particularly in healthcare and engineering. Likely to ease wage pressure in two binding sectors.',
      category: 'External',
    },
    {
      logo: 'assets/images/logos/bloomberg.png',
      time: '3h ago',
      sentiment: 'watch' as 'positive' | 'watch' | 'info',
      title: 'Brent drops below $66 on weak demand outlook',
      description: 'Crude slipped 3.2% as inventories rose. Analysts cut Q2 demand forecasts amid softer industrial activity in Asia.',
      takeaway: 'Watch fiscal-spend assumptions. Adverse-scenario probability nudged from 14% to 17% in the model.',
      category: 'Policy',
    },
    {
      logo: 'assets/images/logos/reuters.png',
      time: '5h ago',
      sentiment: 'positive' as 'positive' | 'watch' | 'info',
      title: 'MoHRE launches Golden-Skill fast-track for AI roles',
      description: 'A new visa category targeting senior AI/ML talent will offer 10-year residency and streamlined family sponsorship.',
      takeaway: 'Directly addresses the widening AI skill gap (Insight #2). Expected ~12 days TTF for senior AI roles within 90 days.',
      category: 'Policy',
    },
    {
      logo: 'assets/images/logos/reuters.png',
      time: '1h ago',
      sentiment: 'info' as 'positive' | 'watch' | 'info',
      title: 'Construction permit volume hits 8-quarter high',
      description: 'ADM issued 1,840 construction permits last week — a 14% jump since Q2 2024 — concentrated in Saadiyat & Yas Island.',
      takeaway: 'Confirms the Construction trend Insight. Pre-permit labour-demand projected to be expanded by 1,200.',
      category: 'Policy',
    },
    {
      logo: 'assets/images/logos/reuters.png',
      time: '1h ago',
      sentiment: 'positive' as 'positive' | 'watch' | 'info',
      title: 'EU Green Deal funding spillover lifts MENA renewables',
      description: '$3.4B of EU-linked sustainability investment flowed into MENA over Q1, with the UAE capturing 28% of inflows.',
      takeaway: 'Strengthens the green jobs Opportunity (Insight #3). Pipeline could exceed 14k roles by year-end.',
      category: 'Policy',
    },
    {
      logo: 'assets/images/logos/reuters.png',
      time: '1h ago',
      sentiment: 'watch' as 'positive' | 'watch' | 'info',
      title: 'Wage index in software roles up 7.4% in 90 days',
      description: 'Survey of 90+ employers shows offer-letter compensation for senior engineers rising sharply.',
      takeaway: 'Confirms the wage-pressure risk. Recommend triggering review of project-cost guidance (Decision #2).',
      category: 'External',
    },
  ]);

  protected readonly findings = signal([
    {
      text: 'Emiratization in Al Ain has reached 52.4%, the highest rate among Abu Dhabi regions.',
      borderColor: '#5CC049',
      metrics: [
        {label: 'Current Value', value: '52.4%'},
        {label: 'Expected',      value: '49.2%'},
        {label: 'Deviation',     value: '+6.5%', color: '#75CA65'},
      ],
      confidenceText: 'High Confidence',
      confidenceColor: '#75CA65',
      confidenceBg: '#75CA651A',
      reasons: ['Hospital expansion projects', 'Seasonal demand', 'New facility openings'],
      opportunitiesLabel: 'Strategic Opportunities:',
      opportunities: [
        'Replicate Al Ain Emiratization models across lower-performing regions',
        'Strengthen healthcare-specific Emirati training pipelines',
      ],
    },
    {
      text: 'Employment in the healthcare sector stands at 81.2%, marking the highest level recorded for this sector.',
      borderColor: '#5CC049',
      metrics: [
        {label: 'Current Value', value: '52.4%'},
        {label: 'Expected',      value: '49.2%'},
        {label: 'Deviation',     value: '+6.5%', color: '#75CA65'},
      ],
      confidenceText: 'High Confidence',
      confidenceColor: '#75CA65',
      confidenceBg: '#75CA651A',
      reasons: ['Hospital expansion projects', 'Seasonal demand', 'New facility openings'],
      opportunitiesLabel: 'Strategic Opportunities:',
      opportunities: [
        'Capitalize on sector growth to build long-term workforce stability',
        'Expand specialized medical training aligned with demand trends',
      ],
    },
    {
      text: 'Job vacancies in the ICT sector remain elevated at 68.7%, indicating persistent skills shortages.',
      borderColor: '#F3393F',
      metrics: [
        {label: 'Current Value', value: '68.7%'},
        {label: 'Expected',      value: '59.8%'},
        {label: 'Deviation',     value: '-14.9%', color: '#F3393F'},
      ],
      confidenceText: 'Medium Confidence',
      confidenceColor: '#F3393F',
      confidenceBg: '#F3393F1A',
      reasons: ['Economic headwinds', 'E-commerce shift', 'Consolidation'],
      opportunitiesLabel: 'Action recommended:',
      opportunities: [
        'Launch fast-track ICT upskilling programs (3–6 months)',
        'Facilitate controlled foreign talent inflow for critical roles',
      ],
    },
    {
      text: 'Labor force participation in Al Dhafra is at 54.1%, the lowest among Abu Dhabi regions.',
      borderColor: '#F3393F',
      metrics: [
        {label: 'Current Value', value: '68.7%'},
        {label: 'Expected',      value: '59.8%'},
        {label: 'Deviation',     value: '-14.9%', color: '#F3393F'},
      ],
      confidenceText: 'Medium Confidence',
      confidenceColor: '#F3393F',
      confidenceBg: '#F3393F1A',
      reasons: ['Economic headwinds', 'E-commerce shift', 'Consolidation'],
      opportunitiesLabel: 'Action recommended:',
      opportunities: [
        'Introduce region-specific employment activation programs',
        'Improve access to jobs (transport, remote work opportunities)',
      ],
    },
  ]);

  protected readonly citizenshipChart = computed<ChartOptions>(() => ({
    chart: {type: 'pie', height: 112, width: 112, backgroundColor: 'transparent', spacing: [0, 0, 0, 0]},
    title: {text: ''},
    credits: {enabled: false},
    tooltip: {enabled: false},
    plotOptions: {
      pie: {
        innerSize: '72%',
        startAngle: 24,
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: 0,
        dataLabels: {enabled: false},
        states: {hover: {enabled: false, halo: null}, inactive: {opacity: 1}},
      },
    },
    series: [{
      type: 'pie',
      data: [
        {name: 'Expat',   y: 93.2, color: '#58B799'},
        {name: 'Emirati', y:  6.8, color: '#2563EA'},
      ],
    }],
  }));

  protected readonly heroSignals = signal<HeroSignal[]>([
    {
      icon: 'arrow-tr',
      iconColor: '#58B799',
      iconBg: '#EEF7F4',
      title: 'Employment Growth',
      subtitle: 'vs last week',
      sparkData: [3, 2.5, 4, 3.2, 5, 4.4, 6, 5.5, 7],
      sparkColor: '#5CC049',
      sparkFill: 'rgba(92, 192, 73, 0.5)',
      delta: '+0.8%',
      deltaVariant: 'badge-success' as const,
    },
    {
      icon: 'arrow-br',
      iconColor: '#58B799',
      iconBg: '#EEF7F4',
      title: 'Unemployment Rate',
      subtitle: 'vs last week',
      sparkData: [7, 6, 5.5, 5, 4.5, 4, 3.5, 4.2, 5],
      sparkColor: '#5CC049',
      sparkFill: 'rgba(92, 192, 73, 0.5)',
      delta: '-0.3pp',
      deltaVariant: 'badge-success' as const,
    },
    {
      icon: 'warning-triangle',
      iconColor: '#FAC656',
      iconBg: '#FFF7E6',
      title: 'AI Skills Gap',
      subtitle: 'vs last month',
      sparkData: [4, 4.5, 5, 4.7, 4.2, 3.8, 4, 4.5, 4.2],
      sparkColor: '#E8B13A',
      sparkFill: 'rgba(232, 177, 58, 0.5)',
      delta: 'High',
      deltaVariant: 'text-warning' as const,
    },
    {
      icon: 'arrow-tr',
      iconColor: '#58B799',
      iconBg: '#EEF7F4',
      title: 'Job Vacancies',
      subtitle: 'vs last month',
      sparkData: [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6.5],
      sparkColor: '#5CC049',
      sparkFill: 'rgba(92, 192, 73, 0.5)',
      delta: '+5.4%',
      deltaVariant: 'badge-success' as const,
    },
    {
      icon: 'group',
      iconColor: '#3375C6',
      iconBg: '#E8F0F9',
      title: 'Emiratisation Rate',
      subtitle: 'vs last month',
      sparkData: [3, 3.5, 4, 3.8, 4.5, 5, 5.5, 6, 6.5],
      sparkColor: '#3375C6',
      sparkFill: 'rgba(51, 117, 198, 0.5)',
      delta: '+0.6pp',
      deltaVariant: 'badge-success' as const,
    },
  ]);

  protected readonly genderChart = computed<ChartOptions>(() => ({
    chart: {type: 'pie', height: 112, width: 112, backgroundColor: 'transparent', spacing: [0, 0, 0, 0]},
    title: {text: ''},
    credits: {enabled: false},
    tooltip: {enabled: false},
    plotOptions: {
      pie: {
        innerSize: '72%',
        startAngle: -40,
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: 0,
        dataLabels: {enabled: false},
        states: {hover: {enabled: false, halo: null}, inactive: {opacity: 1}},
      },
    },
    series: [{
      type: 'pie',
      data: [
        {name: 'Male',   y: 78, color: '#2773D1'},
        {name: 'Female', y: 22, color: '#F33990'},
      ],
    }],
  }));
}
