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

const SPLIT_COLORS: Record<string, { left: string; right: string }> = {
  nationality: {left: '#3375C6', right: '#84A7D3'},
  gender: {left: '#58B799', right: '#A1CBBD'},
};

interface SplitDataResponse {
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
}

interface SplitData extends SplitDataResponse {
  leftColor: string;
  rightColor: string;
  chartOptions?: ChartOptions;
}

interface LaborForceData {
  totalLaborForce: number;
  participationRate: number;
  nationalitySplit: SplitDataResponse;
  genderSplit: SplitDataResponse;
}

@Component({
  selector: 'app-labor-force-composition',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack, TranslateModule],
  templateUrl: './labor-force-composition.html',
  styleUrl: './labor-force-composition.scss',
})
export class LaborForceComposition implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly widgetDetailService = inject(WidgetDetailService);

  totalLaborForce = 1900000;
  participationRate = 78;

  nationalitySplit: SplitData = {
    leftLabel: 'Emirati',
    rightLabel: 'Expat',
    leftValue: 780546,
    rightValue: 1096543,
    leftColor: SPLIT_COLORS['nationality'].left,
    rightColor: SPLIT_COLORS['nationality'].right,
  };

  genderSplit: SplitData = {
    leftLabel: 'Male',
    rightLabel: 'Female',
    leftValue: 1124556,
    rightValue: 770344,
    leftColor: SPLIT_COLORS['gender'].left,
    rightColor: SPLIT_COLORS['gender'].right,
  };

  laborForceChartOptions = signal<ChartOptions | null>(null);
  participationChartOptions = signal<ChartOptions | null>(null);
  widgetType = input<string>('');
  selected = input(false);
  selectedChange = output<void>();
  expandClick = output<void>();

  onWidgetClick(): void {
    this.selectedChange.emit();
  }

  onParticipationRateClick(event: Event): void {
    event.stopPropagation();
    this.widgetDetailService.open(WidgetType.LaborForceParticipation);
  }

  onTotalLaborForceClick(event: Event): void {
    event.stopPropagation();
    this.widgetDetailService.open(WidgetType.LaborForceTotal);
  }

  onNationalitySplitClick(event: Event): void {
    event.stopPropagation();
    this.widgetDetailService.open(WidgetType.LaborForceNationality);
  }

  onGenderSplitClick(event: Event): void {
    event.stopPropagation();
    this.widgetDetailService.open(WidgetType.LaborForceGender);
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.dashboardDataService.getData().subscribe({
      next: (response) => {
        const data = response.laborForceComposition;
        this.totalLaborForce = data.totalLaborForce;
        this.participationRate = data.participationRate;

        this.nationalitySplit = {
          ...data.nationalitySplit,
          leftColor: SPLIT_COLORS['nationality'].left,
          rightColor: SPLIT_COLORS['nationality'].right,
        };

        this.genderSplit = {
          ...data.genderSplit,
          leftColor: SPLIT_COLORS['gender'].left,
          rightColor: SPLIT_COLORS['gender'].right,
        };

        this.buildCharts();
      },
      error: (err) => {
        console.error('Failed to load labor force composition data:', err);
      },
    });
  }

  private buildCharts(): void {
    this.nationalitySplit.chartOptions = this.createSplitBarOptions(this.nationalitySplit);
    this.genderSplit.chartOptions = this.createSplitBarOptions(this.genderSplit);
    this.laborForceChartOptions.set(this.createLaborForceChartOptions());
    this.participationChartOptions.set(this.createParticipationChartOptions());
  }

  private createLaborForceChartOptions(): ChartOptions {
    return {
      chart: {
        type: 'pie',
        height: 120,
        width: 120,
        margin: [0, 0, 0, 0],
        spacing: [0, 0, 0, 0],
        backgroundColor: 'transparent',
      },
      title: {
        text: '',
      },
      tooltip: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          innerSize: '70%',
          startAngle: 90,
          dataLabels: {
            enabled: false,
          },
          borderWidth: 0,
          borderRadius: 0,
          states: {
            hover: {
              enabled: false,
            },
          },
        },
      },
      series: [
        {
          type: 'pie',
          data: [
            {y: 25, color: '#3375C6'},
            {y: 20, color: '#A1CBBD'},
            {y: 25, color: '#58B799'},
            {y: 35, color: '#84A7D3'},
          ],
        },
      ],
    };
  }

  private createParticipationChartOptions(): ChartOptions {
    return {
      chart: {
        type: 'pie',
        height: 120,
        width: 120,
        margin: [0, 0, 0, 0],
        spacing: [0, 0, 0, 0],
        backgroundColor: 'transparent',
      },
      title: {
        text: '',
      },
      tooltip: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          innerSize: '70%',
          startAngle: 90,
          dataLabels: {
            enabled: false,
          },
          borderWidth: 0,
          borderRadius: 0,
          states: {
            hover: {
              enabled: false,
            },
          },
        },
      },
      series: [
        {
          type: 'pie',
          data: [
            {
              y: this.participationRate,
              color: {
                linearGradient: {
                  x1: 0,
                  y1: 1,
                  x2: 1,
                  y2: 0,
                },
                stops: [
                  [0.0839, '#3375C6'],
                  [1, '#58B799'],
                ],
              },
            },
            {y: 100 - this.participationRate, color: '#D9D9D9'},
          ],
        },
      ],
    };
  }

  private createSplitBarOptions(split: SplitData): ChartOptions {
    const total = split.leftValue + split.rightValue;
    const leftPercent = (split.leftValue / total) * 100;
    const overlap = 3;

    return {
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
      yAxis: {
        visible: false,
        min: 0,
        max: 100,
      },
      legend: {enabled: false},
      tooltip: {enabled: false},
      credits: {enabled: false},
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
      series: [
        {
          type: 'bar',
          name: split.leftLabel,
          data: [{y: leftPercent + overlap, color: split.leftColor}],
          zIndex: 1,
        },
        {
          type: 'bar',
          name: split.rightLabel,
          data: [{low: leftPercent - overlap, y: 100, color: split.rightColor}],
          zIndex: 0,
        },
      ],
    };
  }

  getLabelKey(label: string): string {
    return 'HOME.' + label.toUpperCase().replace(/ /g, '_');
  }

  formatCompact(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  formatNumber(value: number): string {
    return value.toLocaleString('de-DE');
  }
}
