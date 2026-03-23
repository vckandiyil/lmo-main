import {Component, computed, inject, input, output} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FlipCard} from '../../atom/flip-card/flip-card';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {WidgetBack} from '../../atom/widget-back/widget-back';
import {GapAnalysisSankey} from '../gap-analysis-sankey/gap-analysis-sankey';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';

@Component({
  selector: 'app-supply-and-demand-widget',
  standalone: true,
  imports: [FlipCard, WidgetHeader, WidgetCheckbox, WidgetBack, GapAnalysisSankey],
  templateUrl: './supply-and-demand-widget.html',
  styleUrl: './supply-and-demand-widget.scss',
})
export class GapAnalysisWidget {
  widgetType = input<string>('supply-and-demand');
  selected   = input(false);

  private readonly entry = toSignal(inject(WidgetCatalogService).getWidgetById('supply-and-demand'), {initialValue: undefined});
  readonly title = computed(() => this.entry()?.title ?? '');
  readonly headerIcons = computed(() =>
    this.entry()?.hasExpandIcon
      ? ['stars', 'stats-up-square', 'expand', 'more']
      : ['stars', 'stats-up-square', 'more']
  );

  selectedChange = output<void>();
  expandClick    = output<void>();

  onWidgetClick(): void {
    this.selectedChange.emit();
  }
}
