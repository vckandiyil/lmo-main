import {Component, input} from '@angular/core';
import {Button} from '../../atom/button/button';
import {Icon} from '../../atom/icon/icon';
import {WhatIfChart} from '../what-if-chart/what-if-chart';
import {ChartCardStatGroup} from '../chart-card/chart-card';

@Component({
  selector: 'app-forecast-card',
  standalone: true,
  imports: [Button, Icon, WhatIfChart],
  templateUrl: './forecast-card.html',
  styleUrl: './forecast-card.scss',
})
export class ForecastCard {
  readonly title = input.required<string>();
  readonly widgetId = input.required<string>();
  readonly current = input.required<ChartCardStatGroup>();
  readonly forecast = input.required<ChartCardStatGroup>();
  readonly target = input.required<ChartCardStatGroup>();
}
