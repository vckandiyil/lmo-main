import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ChartWrapper} from '../../molecule/chart-wrapper/chart-wrapper';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {FlipCard} from '../../atom/flip-card/flip-card';
import {WidgetBack} from '../../atom/widget-back/widget-back';
import {ChartOptions} from '../../../shared/services/chart-config.service';

const STATUS_COLORS: Record<string, string> = {
  'Never Married': '#1E4B7A',
  'Married': '#58B799',
  'Divorced': '#9B8FD7',
  'Widowed': '#589FB7',
  'Unknown': '#C4C8CF',
};

interface StatusDataItem {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-marital-activity-status',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack],
  templateUrl: './marital-activity-status.html',
  styleUrl: './marital-activity-status.scss',
})
export class MaritalActivityStatus implements OnInit {
  private readonly http = inject(HttpClient);

  statusData: StatusDataItem[] = [];
  total = 0;
  chartOptions = signal<ChartOptions | null>(null);
  widgetType = input<string>('');
  selected = input(false);
  selectedChange = output<void>();
  expandClick = output<void>();
  removeClick = output<void>();

  onWidgetClick(): void {
    this.selectedChange.emit();
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.http.get<{data: {visualizations: Array<{series: Array<{label: string; data: Array<{VALUE: number}>}>}>}}>('assets/server-api-jsons/maritalActivityStatus.json').subscribe({
      next: (response) => {
        const series = response.data.visualizations[0].series;
        this.statusData = series.map((s) => ({
          label: s.label,
          value: s.data[s.data.length - 1].VALUE,
          color: STATUS_COLORS[s.label] ?? '#C4C8CF',
        }));
        this.total = this.statusData.reduce((sum, item) => sum + item.value, 0);
        this.buildChart();
      },
      error: (err) => {
        console.error('Failed to load marital activity status data:', err);
      },
    });
  }

  private buildChart(): void {
    const options: ChartOptions = {
      chart: {
        type: 'pie',
        height: 136,
        width: 136,
        margin: [0, 0, 0, 0],
        spacing: [0, 0, 0, 0],
        backgroundColor: 'transparent',
      },
      title: {
        text: '',
      },
      tooltip: {
        enabled: true,
        useHTML: true,
        backgroundColor: '#FFFFFF',
        borderWidth: 0,
        borderRadius: 8,
        shadow: true,
        style: {
          padding: '8px 12px',
        },
        formatter: function () {
          const ctx = this as unknown as {percentage?: number};
          return `<span style="font-family: 'Graphik Trial', sans-serif; font-weight: 600; font-size: 14px; color: #1E4B7A;">${Math.round(ctx.percentage ?? 0)}%</span>`;
        },
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          innerSize: '65%',
          startAngle: -90,
          dataLabels: {
            enabled: false,
          },
          borderWidth: 0,
          borderRadius: 0,
          states: {
            hover: {
              halo: {
                size: 0,
              },
              brightness: 0.1,
            },
          },
          cursor: 'pointer',
        },
      },
      series: [
        {
          type: 'pie',
          data: this.statusData.map((item) => ({
            y: item.value,
            color: item.color,
            name: item.label,
          })),
        },
      ],
    };

    this.chartOptions.set(options);
  }

  formatNumber(value: number): string {
    return value.toLocaleString('de-DE');
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
}
