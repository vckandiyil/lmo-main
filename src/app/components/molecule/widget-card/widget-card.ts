import {Component, computed, input, output, signal} from '@angular/core';
import {ChartWrapper} from '../chart-wrapper/chart-wrapper';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {FlipCard} from '../../atom/flip-card/flip-card';
import {WidgetBack} from '../../atom/widget-back/widget-back';
import {ChartOptions} from '../../../shared/services/chart-config.service';
import type {MoreMenuItem} from '../../atom/more-menu/more-menu';
import type {ViewTypeConfig} from '../../../core/models/widget-detail-json.model';

const CHART_TYPE_I18N: Record<string, string> = {
  line:           'HOME.CHART_TYPE_LINE',
  bar:            'HOME.CHART_TYPE_BAR',
  column:         'HOME.CHART_TYPE_COLUMN',
  pie:            'HOME.CHART_TYPE_PIE',
  table:          'HOME.CHART_TYPE_TABLE',
  heatmap:        'HOME.CHART_TYPE_HEATMAP',
  treemap:        'HOME.CHART_TYPE_TREEMAP',
  networkgraph:   'HOME.CHART_TYPE_NETWORK',
  funnel:         'HOME.CHART_TYPE_FUNNEL',
  bubble:         'HOME.CHART_TYPE_BUBBLE',
  solidgauge:     'HOME.CHART_TYPE_GAUGE',
  columnrange:    'HOME.CHART_TYPE_RANGE',
  spline:         'HOME.CHART_TYPE_SPLINE',
  'stacked-bar':  'HOME.CHART_TYPE_STACKED',
};

@Component({
  selector: 'app-widget-card',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack],
  templateUrl: './widget-card.html',
  styleUrl: './widget-card.scss',
})
export class WidgetCard {
  title           = input.required<string>();
  chartOptions    = input<ChartOptions>({});
  selected        = input(false);
  widgetType      = input<string>('');
  icons           = input<string[]>(['stars', 'stats-up-square', 'more']);
  isCenter        = input(false);
  indicatorName   = input<string>('');
  unit            = input<string>('');
  updatedDate     = input<string>('');
  periodicity     = input<string>('');
  viewTypes       = input<ViewTypeConfig[]>([]);
  activeChartType = input<string>('line');
  tableRows       = input<{year: string; value: number}[]>([]);

  selectedChange  = output<void>();
  expandClick     = output<void>();
  chartTypeChange = output<string>();

  readonly backMode = signal<'ai' | 'info' | 'download'>('ai');

  readonly moreItems = computed<MoreMenuItem[]>(() => {
    const vt = this.viewTypes();
    const chartTypesItem: MoreMenuItem | null = vt.length ? {
      icon: 'graph-up',
      label: 'HOME.MORE_CHART_TYPES',
      children: vt.map(v => ({
        icon: v.icon,
        label: CHART_TYPE_I18N[v.id] ?? v.label,
        value: `chart-type:${v.id}`,
      })),
    } : null;

    return [
      {icon: 'info-empty', label: 'HOME.MORE_INFORMATION'},
      ...(chartTypesItem ? [chartTypesItem] : []),
      {icon: 'forked-arrow', label: 'HOME.MORE_WHAT_IF'},
      {icon: 'download-data-window', label: 'HOME.MORE_DOWNLOAD'},
    ];
  });

  onClick(): void {
    this.selectedChange.emit();
  }
}
