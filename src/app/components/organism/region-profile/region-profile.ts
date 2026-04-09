import {Component, computed, inject, input, OnInit, output, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {forkJoin} from 'rxjs';
import {ChartWrapper} from '../../molecule/chart-wrapper/chart-wrapper';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {FlipCard} from '../../atom/flip-card/flip-card';
import {WidgetBack} from '../../atom/widget-back/widget-back';
import {ChartOptions} from '../../../shared/services/chart-config.service';
import {
  DashboardDataService,
  EmploymentRateDetailData,
  RegionMetric,
  WidgetDetailService,
  WidgetType,
} from '../../../core';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';

const COLORS = {
  positive: {
    line: '#5CC049',
    gradientStart: 'rgba(117, 202, 101, 0.2)',
    gradientEnd: 'rgba(117, 202, 101, 0)',
  },
  negative: {
    line: '#F3393F',
    gradientStart: 'rgba(243, 57, 63, 0.2)',
    gradientEnd: 'rgba(243, 57, 63, 0)',
  },
};

function formatShortNumber(value: number, unit: string): string {
  if (unit === '%') return `${value}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

@Component({
  selector: 'app-region-profile',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack],
  templateUrl: './region-profile.html',
  styleUrl: './region-profile.scss',
})
export class RegionProfile implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly widgetDetailService = inject(WidgetDetailService);

  private readonly catalogEntry = toSignal(inject(WidgetCatalogService).getWidgetById('region-profile'), {initialValue: undefined});
  readonly headerIcons = computed(() =>
    this.catalogEntry()?.hasExpandIcon
      ? ['stars', 'stats-up-square', 'expand', 'more']
      : ['stars', 'stats-up-square', 'more']
  );

  private readonly METRIC_WIDGET_MAP: Record<string, WidgetType> = {
    'Employment': WidgetType.EmploymentRate,
    'Unemployment': WidgetType.UnemploymentRate,
    'Population': WidgetType.PopulationNumber,
    'Emiratisation': WidgetType.Emiratisation,
    'LF participation': WidgetType.LaborForceParticipation,
    'Vacancy Rate': WidgetType.VacancyRate,
  };

  row1Metrics = signal<RegionMetric[]>([]);
  row2Metrics = signal<RegionMetric[]>([]);
  allMetrics = computed(() => [...this.row1Metrics(), ...this.row2Metrics()]);
  chartOptionsMap = signal<Map<string, ChartOptions>>(new Map());
  widgetType = input<string>('');
  selected = input(false);
  isCenter = input(false);
  selectedChange = output<void>();
  expandClick = output<void>();
  removeClick = output<void>();

  isClickable(label: string): boolean {
    return label in this.METRIC_WIDGET_MAP;
  }

  onMetricClick(event: Event, label: string): void {
    event.stopPropagation();
    const widgetType = this.METRIC_WIDGET_MAP[label];
    if (widgetType) {
      this.widgetDetailService.open(widgetType);
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  getChartOptions(label: string): ChartOptions {
    return this.chartOptionsMap().get(label) || {};
  }

  formatValue(metric: RegionMetric): string {
    if (metric.unit === '%') return `${metric.value}%`;
    return metric.value >= 10000
      ? metric.value.toLocaleString('en-US')
      : metric.value.toString();
  }

  private loadData(): void {
    forkJoin({
      dashboard: this.dashboardDataService.getData(),
      employment: this.dashboardDataService.getEmploymentRateDetail(),
      unemployment: this.dashboardDataService.getUnemploymentDetail(),
      population: this.dashboardDataService.getPopulationNumberDetail(),
      emiratisation: this.dashboardDataService.getEmiratisationDetail(),
      laborForce: this.dashboardDataService.getLaborForceParticipationDetail(),
      vacancyRate: this.dashboardDataService.getVacancyRateDetail(),
    }).subscribe({
      next: ({dashboard, employment, unemployment, population, emiratisation, laborForce, vacancyRate}) => {
        const overrideMap: Record<string, RegionMetric> = {
          'Employment': this.extractFromIndicator(employment, 'Employment', true),
          'Unemployment': this.extractFromIndicator(unemployment, 'Unemployment', false),
          'Population': this.extractFromIndicator(population, 'Population', true),
          'Emiratisation': this.extractFromIndicator(emiratisation, 'Emiratisation', true),
          'LF participation': this.extractFromIndicator(laborForce, 'LF participation', true),
          'Vacancy Rate': this.extractFromIndicator(vacancyRate, 'Vacancy Rate', false),
        };

        const resolved = dashboard.regionProfile.metrics.map(m => overrideMap[m.label] ?? m);

        this.row1Metrics.set(resolved.slice(0, 3));
        this.row2Metrics.set(resolved.slice(3, 6));
        this.updateChartOptions();
      },
      error: (err) => console.error('Failed to load region profile data:', err),
    });
  }

  private extractFromIndicator(
    data: EmploymentRateDetailData,
    label: string,
    higherIsBetter: boolean,
  ): RegionMetric {
    const unit = data.unit?.includes('%') ? '%' : '';
    const isPercent = unit === '%';
    const rawData = data.indicatorVisualizations.visualizationsMeta[0].seriesMeta[0].data;
    const trend = rawData.map(d => ({
      value: isPercent ? Math.round(d.VALUE * 10) / 10 : d.VALUE,
      year: d.YEAR as string | undefined,
    }));
    const latest = trend[trend.length - 1]?.value ?? 0;
    const previous = trend[trend.length - 2]?.value ?? latest;
    const isPositive = higherIsBetter ? latest >= previous : latest <= previous;

    return {
      label,
      value: latest,
      unit,
      trend,
      isPositive,
    };
  }

  private updateChartOptions(): void {
    const allMetrics = [...this.row1Metrics(), ...this.row2Metrics()];
    const optionsMap = new Map<string, ChartOptions>();

    allMetrics.forEach((metric) => {
      optionsMap.set(metric.label, this.buildSparklineOptions(metric));
    });

    this.chartOptionsMap.set(optionsMap);
  }

  private buildSparklineOptions(metric: RegionMetric): ChartOptions {
    const colors = metric.isPositive ? COLORS.positive : COLORS.negative;
    const values = metric.trend.map((t) => t.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.1 || 1;
    const hasYears = metric.trend.some(t => t.year);

    const center = this.isCenter();
    return {
      chart: {
        type: 'area',
        height: center ? 64 : 24,
        width: center ? null : 35,
        backgroundColor: 'transparent',
        spacing: [2, 2, 2, 2],
        margin: center ? [28, 0, 0, 0] : [2, 2, 2, 2],
      },
      title: {text: ''},
      xAxis: {
        visible: false,
        labels: {enabled: false},
        lineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        visible: false,
        min: minVal - padding,
        max: maxVal + padding,
        labels: {enabled: false},
        gridLineWidth: 0,
      },
      legend: {enabled: false},
      tooltip: {enabled: false},
      credits: {enabled: false},
      plotOptions: {
        area: {
          clip: false,
          marker: {enabled: center && hasYears},
          states: {hover: {enabled: false}},
          dataLabels: (center && hasYears ? [
            {
              enabled: true,
              verticalAlign: 'middle',
              y: -18,
              crop: false,
              overflow: 'allow',
              style: {fontSize: '10px', fontWeight: '600', color: '#333', textOutline: 'none'},
              formatter: function (this: any) {
                return formatShortNumber(this.y, metric.unit);
              },
            },
            {
              enabled: true,
              verticalAlign: 'middle',
              y: 16,
              crop: false,
              overflow: 'allow',
              style: {fontSize: '9px', fontWeight: '400', color: '#888', textOutline: 'none'},
              formatter: function (this: any) {
                return this.point?.name ?? '';
              },
            },
          ] : [{enabled: false}]) as any,
        },
      },
      series: [
        {
          type: 'area',
          name: metric.label,
          color: colors.line,
          lineWidth: 1,
          fillColor: {
            linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
            stops: [
              [0, colors.gradientStart] as [number, string],
              [1, colors.gradientEnd] as [number, string],
            ],
          } as any,
          data: metric.trend.map(t => ({y: t.value, name: t.year})),
        },
      ],
    };
  }
}
