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

interface AgeGroupData {
  ageGroup: string;
  femaleExpat: number;
  maleExpat: number;
  maleEmirati: number;
  femaleEmirati: number;
  unemployed: number;
}

interface LegendItem {
  label: string;
  color: string;
  key: string;
}

interface WorkforceStructureData {
  ageGroups: AgeGroupData[];
}

@Component({
  selector: 'app-workforce-structure',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack],
  templateUrl: './workforce-structure.html',
  styleUrl: './workforce-structure.scss',
})
export class WorkforceStructure implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly widgetDetailService = inject(WidgetDetailService);

  ageDistributionChartOptionsSignal = signal<ChartOptions>({});
  widgetType = input<string>('');
  selected = input(false);
  selectedChange = output<void>();
  expandClick = output<void>();
  removeClick = output<void>();

  onWidgetClick(): void {
    this.selectedChange.emit();
  }

  onAgeDistributionClick(event: Event): void {
    event.stopPropagation();
    this.widgetDetailService.open(WidgetType.WorkforceAgeDistribution);
  }

  onGenderNationalityClick(event: Event): void {
    event.stopPropagation();
    this.widgetDetailService.open(WidgetType.WorkforceGenderNationality);
  }

  ngOnInit(): void {
    this.loadData();
  }

  ageGroups: AgeGroupData[] = [];

  legendItems: LegendItem[] = [
    {label: 'Female Expat', color: '#1B4B8C', key: 'femaleExpat'},
    {label: 'Male Expat', color: '#3375C6', key: 'maleExpat'},
    {label: 'Male Emirati', color: '#84A7D3', key: 'maleEmirati'},
    {label: 'Female Emirati', color: '#AAC2DF', key: 'femaleEmirati'},
    {label: 'Unemployed', color: '#D9D9D9', key: 'unemployed'},
  ];

  private loadData(): void {
    this.dashboardDataService.getData().subscribe({
      next: (response) => {
        this.ageGroups = response.workforceStructure.ageGroups;
        this.ageDistributionChartOptionsSignal.set(this.buildAgeDistributionChartOptions());
      },
      error: (err) => {
        console.error('Failed to load workforce structure data:', err);
        this.ageDistributionChartOptionsSignal.set(this.buildAgeDistributionChartOptions());
      },
    });
  }

  private buildAgeDistributionChartOptions(): ChartOptions {
    return {
      chart: {
        type: 'column',
        height: 130,
        backgroundColor: 'transparent',
        spacing: [8, 0, 0, 0],
      },
      title: {
        text: '',
      },
      xAxis: {
        categories: this.ageGroups.map(g => g.ageGroup),
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
        tickInterval: 20,
        title: {
          text: '',
        },
        labels: {
          enabled: true,
          y: 4,
          useHTML: true,
          formatter: function () {
            return `<span style="color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 12px;">${this.value}%</span>`;
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
        column: {
          stacking: 'percent',
          borderWidth: 0,
          borderRadius: {
            radius: 0,
            scope: 'stack',
            where: 'end',
          },
          pointWidth: 16,
          states: {
            hover: {
              enabled: false,
            },
          },
        },
      },
      series: [
        {
          name: 'Unemployed',
          type: 'column',
          color: '#D9D9D9',
          data: this.ageGroups.map(g => g.unemployed),
        },
        {
          name: 'Female Emirati',
          type: 'column',
          color: '#AAC2DF',
          data: this.ageGroups.map(g => g.femaleEmirati),
        },
        {
          name: 'Male Emirati',
          type: 'column',
          color: '#84A7D3',
          data: this.ageGroups.map(g => g.maleEmirati),
        },
        {
          name: 'Male Expat',
          type: 'column',
          color: '#3375C6',
          data: this.ageGroups.map(g => g.maleExpat),
        },
        {
          name: 'Female Expat',
          type: 'column',
          color: '#1B4B8C',
          data: this.ageGroups.map(g => g.femaleExpat),
        },
      ],
    };
  }

  get genderNationalityChartOptions(): ChartOptions {
    const totalFemaleExpat = this.ageGroups.reduce((sum, g) => sum + g.femaleExpat, 0);
    const totalMaleExpat = this.ageGroups.reduce((sum, g) => sum + g.maleExpat, 0);
    const totalMaleEmirati = this.ageGroups.reduce((sum, g) => sum + g.maleEmirati, 0);
    const totalFemaleEmirati = this.ageGroups.reduce((sum, g) => sum + g.femaleEmirati, 0);
    const totalUnemployed = this.ageGroups.reduce((sum, g) => sum + g.unemployed, 0);

    return {
      chart: {
        type: 'pie',
        height: 110,
        width: 110,
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
          innerSize: '60%',
          startAngle: -90,
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
            {y: totalFemaleExpat, color: '#1B4B8C'},
            {y: totalMaleExpat, color: '#3375C6'},
            {y: totalMaleEmirati, color: '#84A7D3'},
            {y: totalFemaleEmirati, color: '#AAC2DF'},
            {y: totalUnemployed, color: '#D9D9D9'},
          ],
        },
      ],
    };
  }
}
