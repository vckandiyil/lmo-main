import {Component, input, signal} from '@angular/core';
import {Button} from '../../atom/button/button';
import {Icon} from '../../atom/icon/icon';
import {WhatIfChart} from '../what-if-chart/what-if-chart';

export interface ChartCardStatGroup {
  label: string;
  mainValue: string;
  qoq: string;
  yoy: string;
}

const DOWNLOAD_FORMATS = [
  {id: 'pdf',   label: 'PDF',   icon: 'pdf',   color: '#DB5559', iconColor: '#FFFFFF'},
  {id: 'excel', label: 'Excel', icon: 'excel', color: '#46B45F', iconColor: '#FFFFFF'},
  {id: 'image', label: 'Image', icon: 'image', color: '#F3F4F6', iconColor: '#05264A'},
];

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [Button, Icon, WhatIfChart],
  templateUrl: './chart-card.html',
  styleUrl: './chart-card.scss',
})
export class ChartCard {
  readonly title = input.required<string>();
  readonly widgetId = input.required<string>();
  readonly current = input.required<ChartCardStatGroup>();
  readonly forecast = input.required<ChartCardStatGroup>();
  readonly target = input.required<ChartCardStatGroup>();

  readonly downloadFormats = DOWNLOAD_FORMATS;
  readonly termsAccepted = signal(false);

  toggleTerms(): void {
    this.termsAccepted.update(v => !v);
  }
}
