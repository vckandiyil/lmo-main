import {Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Sidebar} from '../../components/organism/sidebar/sidebar';
import {Filters} from '../../components/organism/filters/filters';
import {GapAnalysisSankey} from '../../components/organism/gap-analysis-sankey/gap-analysis-sankey';
import {WidgetHeader} from '../../components/atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../components/atom/widget-checkbox/widget-checkbox';
import {GapAnalysisTimeline} from '../../components/molecule/gap-analysis-timeline/gap-analysis-timeline';
import {LayoutService} from '../../core';
import {WidgetCatalogService} from '../../core/services/widget-catalog.service';

@Component({
  selector: 'app-gap-analysis',
  standalone: true,
  imports: [Sidebar, Filters, GapAnalysisSankey, WidgetHeader, WidgetCheckbox, GapAnalysisTimeline],
  templateUrl: './gap-analysis.html',
  styleUrl: './gap-analysis.scss',
})
export class GapAnalysisPage {
  readonly layoutMode = inject(LayoutService).layoutMode;

  private readonly entry = toSignal(inject(WidgetCatalogService).getWidgetById('supply-and-demand'), {initialValue: undefined});
  readonly title = computed(() => this.entry()?.title ?? '');

  readonly selectedTimelineYear = signal(2026);
  readonly selectedQuarter      = signal('Q4');
}
