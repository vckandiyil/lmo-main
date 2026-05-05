import {Component, computed, input} from '@angular/core';
import {Icon} from '../../../../../components/atom/icon/icon';
import {Badge} from '../../../../../components/atom/badge/badge';
import {ChartWrapper} from '../../../../../components/molecule/chart-wrapper/chart-wrapper';
import type {ChartOptions} from '../../../../../shared/services/chart-config.service';

@Component({
  selector: 'app-hero-signal-row',
  standalone: true,
  imports: [Icon, Badge, ChartWrapper],
  templateUrl: './hero-signal-row.html',
  styleUrl: './hero-signal-row.scss',
})
export class HeroSignalRow {
  readonly icon = input.required<string>();
  readonly iconColor = input.required<string>();
  readonly iconBg = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly sparkData = input.required<number[]>();
  readonly sparkColor = input.required<string>();
  readonly sparkFill = input.required<string>();
  readonly delta = input.required<string>();
  readonly deltaVariant = input<'badge-success' | 'text-warning'>('badge-success');
  readonly hasDivider = input<boolean>(true);

  protected readonly chartOptions = computed<ChartOptions>(() => ({
    chart: {
      type: 'areaspline',
      width: 92,
      height: 34,
      backgroundColor: 'transparent',
      spacing: [0, 0, 0, 0],
      margin: [0, 0, 0, 0],
    },
    title: {text: ''},
    credits: {enabled: false},
    tooltip: {enabled: false},
    legend: {enabled: false},
    xAxis: {visible: false},
    yAxis: {visible: false},
    plotOptions: {
      areaspline: {
        lineColor: this.sparkColor(),
        lineWidth: 1.5,
        marker: {enabled: false, states: {hover: {enabled: false}}},
        states: {hover: {enabled: false}, inactive: {opacity: 1}},
        fillColor: {
          linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
          stops: [
            [0, this.sparkFill()],
            [1, this.sparkFill().replace(/[\d.]+\)$/, '0)')],
          ],
        },
      },
    },
    series: [{type: 'areaspline', data: this.sparkData()}],
  }));
}
