import {Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Filters} from '../../components/organism/filters/filters';
import {WhatIfSidebar} from '../../components/organism/what-if-sidebar/what-if-sidebar';
import {ChartCard} from '../../components/molecule/chart-card/chart-card';
import {WidgetCatalogService} from '../../core/services/widget-catalog.service';
import {FilterStateService} from '../../core/services/filter-state.service';

@Component({
  selector: 'app-what-if',
  standalone: true,
  imports: [Filters, WhatIfSidebar, ChartCard],
  templateUrl: './what-if.html',
  styleUrl: './what-if.scss',
})
export class WhatIfPage {
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
