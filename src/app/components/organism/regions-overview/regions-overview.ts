import {Component, inject, OnInit, signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {ChartWrapper} from '../../molecule/chart-wrapper/chart-wrapper';
import {Icon} from '../../atom/icon/icon';
import {ChartOptions} from '../../../shared/services/chart-config.service';
import {DashboardDataService} from '../../../core/services/dashboard-data.service';

interface EducationDisplay {
  label: string;
  emirati: string;
  expat: string;
  chartOptions: ChartOptions;
}

interface ImmigrationDisplay {
  label: string;
  value: number;
  pct: number;
  color: string;
}

interface SectorDisplay {
  name: string;
  icon: string;
  value: string;
  pct: number;
  color: string;
}

interface LegendItem {
  label: string;
  value: string;
  pct: string;
  color: string;
}

interface MismatchItem {
  label: string;
  value: string;
  pct: number;
  color: string;
}

@Component({
  selector: 'app-regions-overview',
  standalone: true,
  imports: [ChartWrapper, Icon, TranslateModule],
  templateUrl: './regions-overview.html',
  styleUrl: './regions-overview.scss',
})
export class RegionsOverview implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);

  educationData = signal<EducationDisplay[]>([]);
  totalSupplyChartOptions = signal<ChartOptions | null>(null);
  marketStatusChartOptions = signal<ChartOptions | null>(null);
  frictionChartOptions = signal<ChartOptions | null>(null);

  private readonly immColors: Record<string, string> = {
    'High': '#3375C6',
    'Medium': '#6698D4',
    'Low': '#99BBE3',
  };

  immigrationData = signal<ImmigrationDisplay[]>([
    {label: 'High', value: 11, pct: 40, color: '#3375C6'},
    {label: 'Medium', value: 15.7, pct: 57, color: '#6698D4'},
    {label: 'Low', value: 27.5, pct: 100, color: '#99BBE3'},
  ]);

  statusLegend = signal<LegendItem[]>([
    {label: 'Emirati Male', value: '280k', pct: '8.5%', color: '#1B3A5C'},
    {label: 'Emirati Female', value: '130k', pct: '6.4%', color: '#3375C6'},
    {label: 'Expat Male', value: '1.7M', pct: '71.3%', color: '#58B799'},
    {label: 'Expat Female', value: '0.6M', pct: '13.8', color: '#A1CBBD'},
  ]);

  sectors = signal<SectorDisplay[]>([
    {name: 'Public', icon: 'city', value: '260k', pct: 83, color: '#3375C6'},
    {name: 'Health', icon: 'hospital', value: '170k', pct: 54, color: '#3375C6'},
    {name: 'ICT', icon: 'apple-imac-2021', value: '100k', pct: 32, color: '#3375C6'},
    {name: 'Education', icon: 'open-book', value: '88k', pct: 28, color: '#3375C6'},
    {name: 'Services', icon: 'cart', value: '88k', pct: 28, color: '#3375C6'},
    {name: 'Construction', icon: 'tools', value: '312k', pct: 100, color: '#3375C6'},
  ]);

  mismatchData = signal<MismatchItem[]>([
    {label: 'High Skill Demand', value: '37k', pct: 100, color: '#58B799'},
    {label: 'Medium Skill Demand', value: '29.2k', pct: 79, color: '#91CFBB'},
    {label: 'Low Skill Demand', value: '25k', pct: 68, color: '#DFF1EB'},
  ]);

  ngOnInit(): void {
    this.dashboardDataService.getData().subscribe({
      next: (data) => {
        const maxImm = Math.max(...data.marketEntrants.immigrationData.map(d => d.value));
        const colorOrder = ['#3375C6', '#6698D4', '#99BBE3'];
        this.immigrationData.set(data.marketEntrants.immigrationData.map((d, i) => ({
          label: d.label.replace('-skilled', ''),
          value: d.value,
          pct: (d.value / maxImm) * 100,
          color: colorOrder[i] ?? '#3375C6',
        })));
        this.educationData.set(data.marketEntrants.educationData.map(item => {
          const total = item.emirati + item.expat;
          const emiratiPct = (item.emirati / total) * 100;
          return {
            label: item.label,
            emirati: `${item.emirati}k`,
            expat: `${item.expat}k`,
            chartOptions: this.createEducationBarOptions(emiratiPct),
          };
        }));
      },
    });
    this.buildTotalSupplyChart();
    this.buildMarketStatusChart();
    this.buildFrictionChart();
  }

  getLabelKey(label: string): string {
    return 'HOME.' + label.toUpperCase().replace(/ /g, '_');
  }

  private createEducationBarOptions(emiratiPct: number): ChartOptions {
    const overlap = 3;
    return {
      chart: {type: 'bar', height: 24, spacing: [0, 0, 0, 0], margin: [8, 0, 8, 0], backgroundColor: 'transparent'},
      title: {text: ''}, subtitle: {text: ''},
      xAxis: {visible: false, categories: ['']},
      legend: {enabled: false}, tooltip: {enabled: false}, credits: {enabled: false},
      yAxis: {visible: false, min: 0, max: 100, reversedStacks: false},
      plotOptions: {
        bar: {
          borderRadius: {radius: 96, scope: 'point' as any, where: 'all' as any},
          borderWidth: 0, pointWidth: 8, grouping: false,
        },
        series: {animation: {duration: 1000}, enableMouseTracking: false},
      },
      series: [
        {type: 'bar' as const, name: 'Emirati', data: [{y: emiratiPct + overlap, color: '#3375C6'}], zIndex: 1},
        {type: 'bar' as const, name: 'Expat', data: [{low: emiratiPct - overlap, y: 100, color: '#58B799'}], zIndex: 0},
      ],
    };
  }

  private buildTotalSupplyChart(): void {
    this.totalSupplyChartOptions.set({
      chart: {type: 'pie', height: 100, width: 100, margin: [0, 0, 0, 0], spacing: [0, 0, 0, 0], backgroundColor: 'transparent'},
      title: {text: ''},
      tooltip: {enabled: false},
      credits: {enabled: false},
      plotOptions: {
        pie: {
          innerSize: '55%', startAngle: 90,
          dataLabels: {
            enabled: true, distance: -18, format: '{point.name}',
            style: {fontSize: '11px', fontWeight: '600', color: '#fff', textOutline: 'none'},
          },
          borderWidth: 0, borderRadius: 0, states: {hover: {enabled: false}},
        },
      },
      series: [{type: 'pie', data: [{y: 89, color: '#1B3A5C', name: '89k'}, {y: 65, color: '#58B799', name: '65k'}]}],
    });
  }

  private buildMarketStatusChart(): void {
    this.marketStatusChartOptions.set({
      chart: {type: 'pie', height: 214, width: 214, margin: [0, 0, 0, 0], spacing: [0, 0, 0, 0], backgroundColor: 'transparent'},
      title: {text: ''},
      tooltip: {enabled: false},
      credits: {enabled: false},
      plotOptions: {
        pie: {
          innerSize: '65%', startAngle: 90,
          dataLabels: {
            enabled: true, distance: -15, format: '{point.percentage:.1f}%',
            style: {fontSize: '9px', fontWeight: '600', color: '#fff', textOutline: 'none'},
          },
          borderWidth: 0, borderRadius: 0, states: {hover: {enabled: false}},
        },
      },
      series: [{
        type: 'pie',
        data: [
          {y: 8.5, color: '#1B3A5C', name: 'Emirati Male'},
          {y: 6.4, color: '#3375C6', name: 'Emirati Female'},
          {y: 71.3, color: '#58B799', name: 'Expat Male'},
          {y: 13.8, color: '#A1CBBD', name: 'Expat Female'},
        ],
      }],
    });
  }

  private buildFrictionChart(): void {
    this.frictionChartOptions.set({
      chart: {type: 'pie', height: 90, width: 90, margin: [0, 0, 0, 0], spacing: [0, 0, 0, 0], backgroundColor: 'transparent'},
      title: {text: ''},
      tooltip: {enabled: false},
      credits: {enabled: false},
      plotOptions: {
        pie: {
          innerSize: '65%', startAngle: 90, dataLabels: {enabled: false},
          borderWidth: 0, borderRadius: 0, states: {hover: {enabled: false}},
        },
      },
      series: [{type: 'pie', data: [{y: 58, color: '#1B3A5C'}, {y: 42, color: '#58B799'}]}],
    });
  }
}
