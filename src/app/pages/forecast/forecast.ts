import {Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Filters} from '../../components/organism/filters/filters';
import {ChartCard} from '../../components/molecule/chart-card/chart-card';
import {Button} from '../../components/atom/button/button';
import {WidgetCatalogService} from '../../core/services/widget-catalog.service';
import {FilterStateService} from '../../core/services/filter-state.service';
import {LmiBar} from '../../components/organism/lmi-bar/lmi-bar';

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [Filters, ChartCard, Button, LmiBar],
  templateUrl: './forecast.html',
  styleUrl: './forecast.scss',
})
export class ForecastPage {
  private readonly catalogService = inject(WidgetCatalogService);
  private readonly filterState = inject(FilterStateService);

  private readonly allDetailWidgets = toSignal(
    this.catalogService.getDetailViewWidgets(),
    {initialValue: []},
  );

  readonly visibleWidgets = computed(() => {
    const topic = this.filterState.selectedTopic();
    const widgets = this.allDetailWidgets();
    if (!topic) return widgets;
    return widgets.filter(w => w.category.includes(topic));
  });
}
