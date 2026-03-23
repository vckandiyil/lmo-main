import {Component, input, output} from '@angular/core';
import {ChartWrapper} from '../chart-wrapper/chart-wrapper';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {FlipCard} from '../../atom/flip-card/flip-card';
import {WidgetBack} from '../../atom/widget-back/widget-back';
import {ChartOptions} from '../../../shared/services/chart-config.service';

@Component({
  selector: 'app-widget-card',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack],
  templateUrl: './widget-card.html',
  styleUrl: './widget-card.scss',
})
export class WidgetCard {
  title = input.required<string>();
  chartOptions = input<ChartOptions>({});
  selected = input(false);
  widgetType = input<string>('');
  icons = input<string[]>(['stars', 'stats-up-square', 'more']);
  selectedChange = output<void>();
  expandClick = output<void>();

  onClick(): void {
    this.selectedChange.emit();
  }
}
