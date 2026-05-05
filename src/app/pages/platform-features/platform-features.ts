import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {Icon} from '../../components/atom/icon/icon';
import {FeatureCard} from '../../components/molecule/feature-card/feature-card';
import {Filters} from '../../components/organism/filters/filters';
import {LmiBar} from '../../components/organism/lmi-bar/lmi-bar';
import {LayoutService} from '../../core/services/layout.service';

type FeatureAction =
  | {kind: 'route'; path: string}
  | {kind: 'search'}
  | {kind: 'chat'}
  | {kind: 'report'};

interface FeatureItem {
  iconName: string;
  tagline: string;
  title: string;
  intro: string;
  bullets: string[];
  ctaLabel: string;
  action: FeatureAction;
}

@Component({
  selector: 'app-platform-features',
  standalone: true,
  imports: [Icon, FeatureCard, Filters, LmiBar],
  templateUrl: './platform-features.html',
  styleUrl: './platform-features.scss',
})
export class PlatformFeaturesPage {
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);

  protected readonly intelligenceFeatures: ReadonlyArray<FeatureItem> = [
    {
      iconName: 'search',
      tagline: 'AI Search',
      title: 'Ask anything. Find everything.',
      intro: 'Query the entire platform in plain language — no filters, no menus required.',
      bullets: [
        'Natural language queries across all data',
        'Returns widgets and charts, not just text',
        'Results update dynamically with your filters',
        'Reduces reliance on manual navigation',
      ],
      ctaLabel: 'Open search',
      action: {kind: 'search'},
    },
    {
      iconName: 'ai-icon',
      tagline: 'AI Assistant',
      title: 'Your data, in conversation',
      intro: 'A live, contextual dialogue that lets you explore data the way you think about it.',
      bullets: [
        'Ask follow-up questions in sequence',
        'Answers include relevant charts and widgets',
        'Probe anomalies and request alternative views',
        'Available across any topic or dataset',
      ],
      ctaLabel: 'Open assistant',
      action: {kind: 'chat'},
    },
    {
      iconName: 'stars',
      tagline: 'Widget Insights',
      title: 'Every chart tells a deeper story',
      intro: 'Flip any widget to reveal an AI narrative tied directly to that dataset.',
      bullets: [
        'AI insight linked to the specific widget data',
        'Adapts to the filters currently applied',
        'Highlights what changed and what to watch',
        'Available on every widget across the platform',
      ],
      ctaLabel: 'See widgets',
      action: {kind: 'route', path: '/'},
    },
    {
      iconName: 'user',
      tagline: 'Perspective Profiles',
      title: 'Insights shaped to your role',
      intro: 'The same data surfaces different signals depending on who is reading it.',
      bullets: [
        'Switch between policymaker, employer, or job seeker lens',
        'AI adjusts emphasis, language, and analysis focus',
        'Applies across the full dashboard, not just single widgets',
        'Helps teams share context across different roles',
      ],
      ctaLabel: 'Try profiles',
      action: {kind: 'route', path: '/'},
    },
  ];

  protected readonly platformFeatures: ReadonlyArray<FeatureItem> = [
    {
      iconName: 'options',
      tagline: 'What-If Analysis',
      title: 'Test policy before it becomes policy',
      intro: 'Simulate how changes in economic and policy assumptions reshape projected labour market outcomes.',
      bullets: [
        'Adjust levers: participation, sector growth, Emiratization targets',
        'Charts and KPIs update in real time as you move sliders',
        'Forecast scenarios up to 10 years into the future',
      ],
      ctaLabel: 'Open What-If',
      action: {kind: 'route', path: '/what-if'},
    },
    {
      iconName: 'chart-spline',
      tagline: 'Forecasting',
      title: 'See the labour market before it arrives',
      intro: 'Project any indicator up to 10 years forward, scoped to exactly the segment you need.',
      bullets: [
        '1–10 year projections per indicator',
        'Filter by region, citizenship, gender, or sector',
        'AI commentary explains each forecast trend',
      ],
      ctaLabel: 'Open Forecasting',
      action: {kind: 'route', path: '/forecast'},
    },
    {
      iconName: 'vertical-bars',
      tagline: 'Labour Market Insights',
      title: 'Every dimension of the workforce, in one view',
      intro: 'A topic-driven dashboard covering employment, vacancies, talent pools, and more.',
      bullets: [
        '6 topic views: Employment, Unemployment, Vacancies, and more',
        'Interactive regional maps, Sankey diagrams, and tree maps',
        'Focused or grid layout — switch to match your workflow',
        'Universal filters apply instantly across all widgets',
      ],
      ctaLabel: 'Open Insights',
      action: {kind: 'route', path: '/labor-market-insights'},
    },
    {
      iconName: 'reports',
      tagline: 'Reporting',
      title: 'Structured outputs, without the manual effort',
      intro: 'Scope a report by region, sector, and time range — AI handles the structure and narrative.',
      bullets: [
        'Filter scope by region, sector, and time range',
        'AI generates the report narrative from selected data',
        'Export as a shareable document in one action',
      ],
      ctaLabel: 'Create report',
      action: {kind: 'report'},
    },
    {
      iconName: 'report-columns',
      tagline: 'My LMO',
      title: 'Your dashboard. Your way.',
      intro: 'Build personalised dashboards from any widget across the platform — no fixed structure, no rebuilding.',
      bullets: [
        'Create unlimited named dashboards for different purposes',
        'Pull widgets from any topic area into one workspace',
        'Save widgets while exploring — add them to any dashboard',
        'Drag-and-drop layout, fully under your control',
      ],
      ctaLabel: 'Open My LMO',
      action: {kind: 'route', path: '/my-lmo'},
    },
  ];

  protected onFeatureClick(action: FeatureAction): void {
    switch (action.kind) {
      case 'route':
        this.router.navigateByUrl(action.path);
        break;
      case 'search':
        this.layoutService.requestSearchModal();
        break;
      case 'chat':
        this.layoutService.requestAiChat();
        break;
      case 'report':
        this.layoutService.requestReportModal();
        break;
    }
  }
}
