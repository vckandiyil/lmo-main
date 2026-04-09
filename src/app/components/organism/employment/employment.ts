import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {ChartWrapper} from '../../molecule/chart-wrapper/chart-wrapper';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {FlipCard} from '../../atom/flip-card/flip-card';
import {WidgetBack} from '../../atom/widget-back/widget-back';
import {ChartOptions} from '../../../shared/services/chart-config.service';
import {DashboardDataService} from '../../../core';

interface EmploymentData {
  employmentData: number[];
  unemploymentData: number[];
  years: string[];
}

@Component({
  selector: 'app-employment',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack],
  templateUrl: './employment.html',
  styleUrl: './employment.scss',
})
export class Employment implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);

  employmentData: number[] = [];
  unemploymentData: number[] = [];
  years: string[] = [];

  chartOptionsSignal = signal<ChartOptions>({});
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
    this.dashboardDataService.getData().subscribe({
      next: (response) => {
        this.employmentData = response.employment.employmentData;
        this.unemploymentData = response.employment.unemploymentData;
        this.years = response.employment.years;
        this.chartOptionsSignal.set(this.buildChartOptions());
      },
      error: (err) => {
        console.error('Failed to load employment data:', err);
        this.chartOptionsSignal.set(this.buildChartOptions());
      },
    });
  }

  private buildChartOptions(): ChartOptions {
    return {
      chart: {
        type: 'line',
        height: 100,
        backgroundColor: 'transparent',
        spacing: [5, 10, 0, 0],
      },
      title: {
        text: '',
      },
      xAxis: {
        categories: this.years,
        labels: {
          enabled: true,
          y: 14,
          useHTML: true,
          formatter: function () {
            return `<span style="color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 12px;">${this.value}</span>`;
          },
        },
        lineWidth: 0,
        tickWidth: 0,
        offset: 4,
      },
      yAxis: {
        min: 0,
        max: 100,
        tickInterval: 25,
        title: {
          text: '',
        },
        labels: {
          enabled: true,
          y: 4,
          useHTML: true,
          formatter: function () {
            return `<span style="color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 12px;">${this.value}</span>`;
          },
        },
        gridLineColor: '#CFDCEC',
        gridLineWidth: 0.5,
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
            lineWidth: 0,
          },
          states: {
            hover: {
              enabled: false,
            },
          },
        },
      },
      series: [
        {
          type: 'line',
          name: 'Employment',
          color: '#3375C6',
          lineWidth: 2,
          data: this.employmentData,
          marker: {
            fillColor: '#3375C6',
          },
        },
        {
          type: 'line',
          name: 'Unemployment',
          color: '#AAC2DF',
          lineWidth: 2,
          data: this.unemploymentData,
          marker: {
            fillColor: '#AAC2DF',
          },
        },
      ],
    };
  }
}
