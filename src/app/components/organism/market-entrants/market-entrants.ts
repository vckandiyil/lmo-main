import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {ChartWrapper} from '../../molecule/chart-wrapper/chart-wrapper';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {FlipCard} from '../../atom/flip-card/flip-card';
import {WidgetBack} from '../../atom/widget-back/widget-back';
import {ChartOptions} from '../../../shared/services/chart-config.service';
import {DashboardDataService} from '../../../core';
import {WidgetDetailService} from '../../../core/services/widget-detail.service';
import {WidgetType} from '../../../core/models/widget.model';

const EDUCATION_COLORS: Record<string, { emirati: string; expat: string }> = {
  'Secondary Education': {emirati: '#3375C6', expat: '#84A7D3'},
  'Higher Education': {emirati: '#58B799', expat: '#A1CBBD'},
};

interface EducationDataResponse {
  label: string;
  emirati: number;
  expat: number;
}

interface EducationData extends EducationDataResponse {
  emiratiColor: string;
  expatColor: string;
  chartOptions?: ChartOptions;
}

interface SkillData {
  label: string;
  value: number;
}

interface MarketEntrantsData {
  educationData: EducationDataResponse[];
  immigrationData: SkillData[];
}

@Component({
  selector: 'app-market-entrants',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack, TranslateModule],
  templateUrl: './market-entrants.html',
  styleUrl: './market-entrants.scss',
})
export class MarketEntrants implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly widgetDetailService = inject(WidgetDetailService);

  educationData: EducationData[] = [];
  immigrationChartOptions = signal<ChartOptions>({});
  private immigrationData: SkillData[] = [];
  widgetType = input<string>('');
  selected = input(false);
  selectedChange = output<void>();
  expandClick = output<void>();

  onWidgetClick(): void {
    this.selectedChange.emit();
  }

  onEducationClick(event: Event): void {
    event.stopPropagation();
    this.widgetDetailService.open(WidgetType.MarketEntrantsEducation);
  }

  onImmigrationClick(event: Event): void {
    event.stopPropagation();
    this.widgetDetailService.open(WidgetType.MarketEntrantsImmigration);
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.dashboardDataService.getData().subscribe({
      next: (response) => {
        const data = response.marketEntrants;
        this.educationData = data.educationData.map((item) => ({
          ...item,
          emiratiColor: EDUCATION_COLORS[item.label]?.emirati ?? '#3375C6',
          expatColor: EDUCATION_COLORS[item.label]?.expat ?? '#84A7D3',
        }));
        this.immigrationData = data.immigrationData;
        this.buildEducationCharts();
        this.buildImmigrationChart();
      },
      error: (err) => {
        console.error('Failed to load market entrants data:', err);
      },
    });
  }

  formatValue(value: number): string {
    return `${value}k`;
  }

  getLabelKey(label: string): string {
    return 'HOME.' + label.toUpperCase().replace(/ /g, '_');
  }

  private buildEducationCharts(): void {
    this.educationData = this.educationData.map((item) => ({
      ...item,
      chartOptions: this.createEducationBarOptions(item),
    }));
  }

  private createEducationBarOptions(item: EducationData): ChartOptions {
    const options: ChartOptions = {
      chart: {
        type: 'bar',
        height: 24,
        spacing: [0, 0, 0, 0],
        margin: [8, 0, 8, 0],
        backgroundColor: 'transparent',
      },
      title: {text: ''},
      subtitle: {text: ''},
      xAxis: {
        visible: false,
        categories: [''],
      },
      legend: {enabled: false},
      tooltip: {enabled: false},
      credits: {enabled: false},
      yAxis: {
        visible: false,
        min: 0,
        max: 100,
        reversedStacks: false,
      },
      plotOptions: {
        bar: {
          borderRadius: {
            radius: 96,
            scope: 'point',
            where: 'all',
          },
          borderWidth: 0,
          pointWidth: 8,
          grouping: false,
        },
        series: {
          animation: {duration: 1000},
          enableMouseTracking: false,
        },
      },
      series: (() => {
        const total = item.emirati + item.expat;
        const emiratiPercent = (item.emirati / total) * 100;
        const expatPercent = (item.expat / total) * 100;
        const overlap = 3;
        return [
          {
            type: 'bar' as const,
            name: 'Emirati',
            data: [{y: emiratiPercent + overlap, color: item.emiratiColor}],
            zIndex: 1,
          },
          {
            type: 'bar' as const,
            name: 'Expat',
            data: [{low: emiratiPercent - overlap, y: 100, color: item.expatColor}],
            zIndex: 0,
          },
        ];
      })(),
    };

    return options;
  }

  private buildImmigrationChart(): void {
    const maxValue = Math.max(...this.immigrationData.map((d) => d.value));

    const options: ChartOptions = {
      chart: {
        type: 'bar',
        height: 75,
        spacing: [0, 0, 0, 0],
        margin: [0, 50, 0, 110],
        backgroundColor: 'transparent',
      },
      title: {text: ''},
      subtitle: {text: ''},
      xAxis: {
        categories: this.immigrationData.map((d) => d.label),
        lineWidth: 0,
        tickWidth: 0,
        labels: {
          align: 'left',
          reserveSpace: true,
          useHTML: true,
          formatter: function () {
            return `<span style="color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 14px;">${this.value}</span>`;
          },
        },
      },
      yAxis: {
        visible: false,
        min: 0,
        max: maxValue * 1.2,
      },
      legend: {enabled: false},
      credits: {enabled: false},
      tooltip: {enabled: false},
      plotOptions: {
        bar: {
          borderRadius: {
            radius: 96,
            scope: 'point',
            where: 'all',
          },
          borderWidth: 0,
          pointWidth: 8,
          color: '#589FB7',
          groupPadding: 0,
          pointPadding: 0.1,
          dataLabels: {
            enabled: true,
            inside: false,
            align: 'left',
            useHTML: true,
            formatter: function () {
              return `<span style="color: var(--lmo-text-value); font-family: 'Graphik Trial', sans-serif; font-weight: 600; font-size: 14px;">${this.y}k</span>`;
            },
          },
        },
        series: {
          animation: {duration: 1000},
          enableMouseTracking: false,
        },
      },
      series: [
        {
          type: 'bar',
          name: 'Value',
          data: this.immigrationData.map((d) => d.value),
        },
      ],
    };

    this.immigrationChartOptions.set(options);
  }
}
