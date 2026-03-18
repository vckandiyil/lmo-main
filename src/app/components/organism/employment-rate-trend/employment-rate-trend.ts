import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {ChartWrapper} from '../../molecule/chart-wrapper/chart-wrapper';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {FlipCard} from '../../atom/flip-card/flip-card';
import {WidgetBack} from '../../atom/widget-back/widget-back';
import {ChartOptions} from '../../../shared/services/chart-config.service';
import {DashboardDataService} from '../../../core';

interface TrendData {
  x: number;
  y: number;
}

interface EmploymentRateTrendData {
  trendData: TrendData[];
  yAxisMin: number;
  yAxisMax: number;
  tickPositions: number[];
}

@Component({
  selector: 'app-employment-rate-trend',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack],
  templateUrl: './employment-rate-trend.html',
  styleUrl: './employment-rate-trend.scss',
})
export class EmploymentRateTrend implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);

  trendData: TrendData[] = [];
  yAxisMin = 93;
  yAxisMax = 97;
  tickPositions = [93, 95, 97];

  chartOptionsSignal = signal<ChartOptions>({});
  widgetType = input<string>('');
  selected = input(false);
  selectedChange = output<void>();
  expandClick = output<void>();

  onWidgetClick(): void {
    this.selectedChange.emit();
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.dashboardDataService.getData().subscribe({
      next: (response) => {
        const data = response.employmentRateTrend;
        this.trendData = data.trendData;
        this.yAxisMin = data.yAxisMin;
        this.yAxisMax = data.yAxisMax;
        this.tickPositions = data.tickPositions;
        this.chartOptionsSignal.set(this.buildChartOptions());
      },
      error: (err) => {
        console.error('Failed to load employment rate trend data:', err);
        this.chartOptionsSignal.set(this.buildChartOptions());
      },
    });
  }

  private buildChartOptions(): ChartOptions {
    return {
      chart: {
        type: 'line',
        height: 86,
        backgroundColor: 'transparent',
        spacing: [20, 10, 5, 0],
      },
      title: {
        text: '',
      },
      xAxis: {
        visible: false,
        min: 0,
        max: 3,
      },
      yAxis: {
        min: this.yAxisMin,
        max: this.yAxisMax,
        tickPositions: this.tickPositions,
        title: {
          text: '',
        },
        labels: {
          enabled: true,
          useHTML: true,
          formatter: function () {
            return `<span style="color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 12px;">${this.value}%</span>`;
          },
        },
        gridLineWidth: 1,
        gridLineColor: '#FFFFFF',
        gridZIndex: 5,
      },
      legend: {
        enabled: false,
      },
      tooltip: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        line: {
          marker: {
            enabled: true,
            symbol: 'circle',
            radius: 2.5,
            fillColor: '#3375C6',
            lineWidth: 0,
          },
          dataLabels: {
            enabled: true,
            useHTML: true,
            formatter: function () {
              return `<span style="color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 12px;">${this.y}%</span>`;
            },
            verticalAlign: 'bottom',
            y: -5,
            overflow: 'allow',
            crop: false,
          },
          states: {
            hover: {
              enabled: false,
            },
          },
        },
        area: {
          enableMouseTracking: false,
          states: {
            hover: {
              enabled: false,
            },
          },
        },
      },
      series: [
        // Bottom row (93-95)
        {
          type: 'area',
          data: [[0, 93], [0, 95], [0.75, 95], [0.75, 93]],
          color: '#EAEBEA',
          fillOpacity: 1,
          lineWidth: 0,
          marker: {enabled: false},
          enableMouseTracking: false,
          zIndex: 1,
        },
        {
          type: 'area',
          data: [[0.75, 93], [0.75, 95], [1.5, 95], [1.5, 93]],
          color: '#DBEBDD',
          fillOpacity: 1,
          lineWidth: 0,
          marker: {enabled: false},
          enableMouseTracking: false,
          zIndex: 1,
        },
        {
          type: 'area',
          data: [[1.5, 93], [1.5, 95], [2.25, 95], [2.25, 93]],
          color: '#C6EBCB',
          fillOpacity: 1,
          lineWidth: 0,
          marker: {enabled: false},
          enableMouseTracking: false,
          zIndex: 1,
        },
        {
          type: 'area',
          data: [[2.25, 93], [2.25, 95], [3, 95], [3, 93]],
          color: '#A8E0AF',
          fillOpacity: 1,
          lineWidth: 0,
          marker: {enabled: false},
          enableMouseTracking: false,
          zIndex: 1,
        },
        // Top row (95-97)
        {
          type: 'area',
          data: [[0, 95], [0, 97], [0.75, 97], [0.75, 95]],
          color: '#EAEBEA',
          fillOpacity: 1,
          lineWidth: 0,
          marker: {enabled: false},
          enableMouseTracking: false,
          zIndex: 1,
        },
        {
          type: 'area',
          data: [[0.75, 95], [0.75, 97], [1.5, 97], [1.5, 95]],
          color: '#DBEBDD',
          fillOpacity: 1,
          lineWidth: 0,
          marker: {enabled: false},
          enableMouseTracking: false,
          zIndex: 1,
        },
        {
          type: 'area',
          data: [[1.5, 95], [1.5, 97], [2.25, 97], [2.25, 95]],
          color: '#C6EBCB',
          fillOpacity: 1,
          lineWidth: 0,
          marker: {enabled: false},
          enableMouseTracking: false,
          zIndex: 1,
        },
        {
          type: 'area',
          data: [[2.25, 95], [2.25, 97], [3, 97], [3, 95]],
          color: '#A8E0AF',
          fillOpacity: 1,
          lineWidth: 0,
          marker: {enabled: false},
          enableMouseTracking: false,
          zIndex: 1,
        },
        // Line chart on top
        {
          type: 'line',
          name: 'Employment Rate Trend',
          color: '#3375C6',
          lineWidth: 2,
          data: this.trendData,
          zIndex: 100,
        },
      ],
    };
  }
}
