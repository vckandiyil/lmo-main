import {Component, input, output} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [WidgetCheckbox, TranslateModule],
  templateUrl: './ai-insights.html',
  styleUrl: './ai-insights.scss',
})
export class AiInsights {
  widgetType = input<string>('');
  selected = input(false);
  selectedChange = output<void>();

  onWidgetClick(): void {
    this.selectedChange.emit();
  }
}
