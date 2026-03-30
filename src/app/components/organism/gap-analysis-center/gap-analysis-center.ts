import {AfterViewInit, Component, computed, ElementRef, inject, output, signal, ViewChild} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import {GapAnalysisSankey} from '../gap-analysis-sankey/gap-analysis-sankey';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {GapAnalysisTimeline} from '../../molecule/gap-analysis-timeline/gap-analysis-timeline';

@Component({
  selector: 'app-gap-analysis-center',
  standalone: true,
  imports: [GapAnalysisSankey, WidgetHeader, WidgetCheckbox, GapAnalysisTimeline],
  templateUrl: './gap-analysis-center.html',
  styleUrl: './gap-analysis-center.scss',
})
export class GapAnalysisCenter implements AfterViewInit {
  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLElement>;

  readonly closed = output<void>();

  private readonly entry = toSignal(inject(WidgetCatalogService).getWidgetById('supply-and-demand'), {initialValue: undefined});
  readonly title = computed(() => this.entry()?.title ?? '');

  readonly selectedTimelineYear = signal(2026);
  readonly selectedQuarter      = signal('Q4');
  readonly chartHeight          = signal(500);

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.chartHeight.set(this.chartContainer.nativeElement.offsetHeight);
    });
  }
}
