import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {ChartWrapper} from '../../molecule/chart-wrapper/chart-wrapper';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {FlipCard} from '../../atom/flip-card/flip-card';
import {WidgetBack} from '../../atom/widget-back/widget-back';
import {ChartOptions} from '../../../shared/services/chart-config.service';
import {DashboardDataService} from '../../../core';
import {WidgetDetailService} from '../../../core/services/widget-detail.service';
import {WidgetType} from '../../../core/models/widget.model';

interface SectorData {
  name: string;
  vacancies: number;
  jobseekers: number;
  gap: number;
}

interface SectorGapsData {
  sectors: SectorData[];
}

@Component({
  selector: 'app-sector-gaps-opportunities',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack],
  templateUrl: './sector-gaps-opportunities.html',
  styleUrl: './sector-gaps-opportunities.scss',
})
export class SectorGapsOpportunities implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly widgetDetailService = inject(WidgetDetailService);

  chartOptionsSignal = signal<ChartOptions>({});
  widgetType = input<string>('');
  selected = input(false);
  selectedChange = output<void>();
  expandClick = output<void>();

  onWidgetClick(): void {
    this.selectedChange.emit();
  }

  onChartClick(event: Event): void {
    event.stopPropagation();
    this.widgetDetailService.open(WidgetType.SectorGapsOpportunities);
  }

  ngOnInit(): void {
    this.loadData();
  }

  sectors: SectorData[] = [];

  private loadData(): void {
    this.dashboardDataService.getData().subscribe({
      next: (response) => {
        this.sectors = response.sectorGapsOpportunities.sectors;
        this.chartOptionsSignal.set(this.buildChartOptions());
      },
      error: (err) => {
        console.error('Failed to load sector gaps data:', err);
        this.chartOptionsSignal.set(this.buildChartOptions());
      },
    });
  }

  private buildChartOptions(): ChartOptions {
    return {
      chart: {
        type: 'bar',
        height: 110,
        backgroundColor: 'transparent',
        spacing: [0, 0, 0, 0],
        margin: [0, 10, 18, 90],
      },
      title: {
        text: '',
      },
      xAxis: {
        categories: this.sectors.map(s => s.name),
        labels: {
          step: 1,
          align: 'right',
          useHTML: true,
          formatter: function () {
            return `<span style="color: var(--lmo-text-primary); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 12px; text-align: right;">${this.value}</span>`;
          },
        },
        lineWidth: 0,
        tickWidth: 0,
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
          y: 12,
          align: 'center',
          useHTML: true,
          formatter: function () {
            return `<span style="color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 500; font-size: 12px;">${this.value}</span>`;
          },
        },
        gridLineColor: '#B7C3D2',
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
        bar: {
          grouping: false,
          borderRadius: 700,
          borderWidth: 0,
          pointPadding: 0,
          groupPadding: 0.05,
          states: {
            hover: {
              enabled: false,
            },
          },
        },
      },
      series: [
        {
          name: 'Jobseekers',
          type: 'bar',
          color: '#AAC2DF',
          borderColor: '#AAC2DF',
          borderWidth: 0.5,
          borderRadius: {
            radius: 700,
            scope: 'point',
            where: 'all',
          },
          data: this.sectors.map(s => s.jobseekers),
          pointWidth: 8,
          zIndex: 0,
        },
        {
          name: 'Vacancies',
          type: 'bar',
          color: '#3375C6',
          borderColor: '#3375C6',
          borderWidth: 0.5,
          borderRadius: {
            radius: 700,
            scope: 'point',
            where: 'all',
          },
          data: this.sectors.map(s => s.vacancies),
          pointWidth: 8,
          zIndex: 1,
        },
      ],
    };
  }

  formatGap(gap: number): string {
    return `${gap.toFixed(1)}%`;
  }
}
