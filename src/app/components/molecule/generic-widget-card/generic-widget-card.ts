import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {forkJoin} from 'rxjs';
import {WidgetCard} from '../widget-card/widget-card';
import {WidgetDetailConfigService} from '../../../core/services/widget-detail-config.service';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import {DashboardDataService} from '../../../core';
import type {ChartOptions} from '../../../shared/services/chart-config.service';
import type {WidgetDetailData} from '../../../core/models/widget-detail.model';

@Component({
  selector: 'app-generic-widget-card',
  standalone: true,
  imports: [WidgetCard],
  template: `
    <app-widget-card
      [title]="title()"
      [chartOptions]="chartOptions()"
      [selected]="selected()"
      [widgetType]="widgetType()"
      [icons]="icons()"
      (selectedChange)="selectedChange.emit()"
      (expandClick)="expandClick.emit()"
    />
  `,
})
export class GenericWidgetCard implements OnInit {
  private readonly configService        = inject(WidgetDetailConfigService);
  private readonly catalogService       = inject(WidgetCatalogService);
  private readonly dashboardDataService = inject(DashboardDataService);

  widgetType     = input.required<string>();
  selected       = input(false);
  isCenter       = input(false);
  selectedChange = output<void>();
  expandClick = output<void>();

  title        = signal('');
  chartOptions = signal<ChartOptions>({});
  icons        = signal<string[]>(['stars', 'stats-up-square', 'more']);

  ngOnInit(): void {
    forkJoin({
      configs:  this.configService.allConfigs$,
      catalog:  this.catalogService.getWidgetById(this.widgetType()),
    }).subscribe(({configs, catalog}) => {
      const config = configs.configMap.get(this.widgetType());
      if (!config) return;

      this.title.set(catalog?.title ?? this.widgetType());
      if (catalog?.hasExpandIcon) {
        this.icons.set(['stars', 'stats-up-square', 'expand', 'more']);
      }

      config.loadData(this.dashboardDataService).subscribe(data => {
        this.chartOptions.set(this.buildMiniChartOptions(data));
      });
    });
  }

  private buildMiniChartOptions(data: WidgetDetailData): ChartOptions {
    const isPercent = data.unit?.includes('%') ?? false;
    const values    = data.series.map(d => d.value);
    const years     = data.series.map(d => d.year);
    const isMillion = !isPercent && values.some(v => Math.abs(v) >= 100_000);

    const {yMin, yMax, tickInterval} = this.calcYAxis(values, isPercent, isMillion);

    const labelStyle = `color: var(--lmo-text-category); font-family: 'Graphik Trial', sans-serif; font-weight: 400; font-size: 12px;`;

    return {
      chart: {type: 'line', height: this.isCenter() ? undefined : 112, backgroundColor: 'transparent', spacing: [18, 10, 0, 0]},
      title: {text: ''},
      xAxis: {
        categories: years,
        labels: {
          enabled: true, y: 14, useHTML: true,
          formatter: function () {
            return `<span style="${labelStyle}">${this.value}</span>`;
          },
        },
        lineWidth: 0, tickWidth: 0, offset: 4,
      },
      yAxis: {
        min: yMin, max: yMax, tickInterval,
        title: {text: ''},
        labels: {
          enabled: true, y: 4, useHTML: true,
          formatter: isMillion
            ? function () {
                return `<span style="${labelStyle}">${((this.value as number) / 1_000_000).toFixed(1)}M</span>`;
              }
            : function () {
                return `<span style="${labelStyle}">${this.value}</span>`;
              },
        },
        gridLineColor: '#CFDCEC', gridLineWidth: 0.5,
      },
      legend: {enabled: false},
      tooltip: {enabled: false},
      credits: {enabled: false},
      plotOptions: {
        line: {
          marker: {enabled: true, symbol: 'circle', radius: 2.5, fillColor: '#3375C6', lineWidth: 0, lineColor: '#3375C6'},
          dataLabels: {
            enabled: true,
            ...(isMillion
              ? {
                  formatter: function () {
                    return ((this.y as number) / 1_000_000).toFixed(1) + 'M';
                  },
                }
              : {format: isPercent ? '{y}%' : '{y}'}),
            style: {
              fontFamily: "'Graphik Trial', sans-serif",
              fontWeight: '500',
              fontSize: '12px',
              lineHeight: '12px',
              color: '#3375C6',
              textOutline: 'none',
            },
            verticalAlign: 'bottom', y: -2, overflow: 'allow', crop: false,
          },
          states: {hover: {enabled: false}},
        },
      },
      series: [{
        type: 'line', color: '#3375C6', lineWidth: 2, data: values,
      }],
    };
  }

  private calcYAxis(
    values: number[],
    isPercent: boolean,
    isMillion: boolean,
  ): {yMin: number; yMax: number; tickInterval: number} {
    if (values.length === 0) return {yMin: 0, yMax: 100, tickInterval: 25};

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (isMillion) {
      const step        = 100_000;
      const yMin        = Math.floor((min - step) / step) * step;
      const yMax        = Math.ceil((max + step) / step) * step;
      const tickInterval = Math.round((yMax - yMin) / 4 / step) * step || step;
      return {yMin, yMax, tickInterval};
    }

    const pad          = isPercent ? 1 : Math.max(1, (max - min) * 0.1);
    const yMin         = Math.floor(min - pad);
    const yMax         = Math.ceil(max + pad);
    const tickInterval = Math.max(1, Math.round((yMax - yMin) / 4));
    return {yMin, yMax, tickInterval};
  }
}
