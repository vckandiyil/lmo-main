import {AfterViewInit, Component, computed, DestroyRef, ElementRef, inject, OnInit, output, signal, ViewChild} from '@angular/core';
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
  host: {'[class.gap-analysis-center-host--fullscreen]': 'isFullscreen()'},
})
export class GapAnalysisCenter implements OnInit, AfterViewInit {
  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLElement>;

  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly closed = output<void>();

  private readonly entry = toSignal(inject(WidgetCatalogService).getWidgetById('supply-and-demand'), {initialValue: undefined});
  readonly title = computed(() => this.entry()?.title ?? '');
  readonly headerIcons = computed(() =>
    this.entry()?.hasExpandIcon
      ? ['stars', 'stats-up-square', 'expand', 'more']
      : ['stars', 'stats-up-square', 'more']
  );

  readonly compact = signal(window.matchMedia('(max-width: 1199.98px)').matches);

  readonly selectedTimelineYear = signal(2026);
  readonly selectedQuarter      = signal('Q4');
  readonly chartHeight          = signal(500);
  readonly isFullscreen         = signal(false);

  private readonly onFullscreenChange = (): void => {
    this.isFullscreen.set(!!document.fullscreenElement);
    setTimeout(() => {
      this.chartHeight.set(this.chartContainer.nativeElement.offsetHeight);
    }, 100);
  };

  ngOnInit(): void {
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    });
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.el.nativeElement.requestFullscreen();
    }
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.chartHeight.set(this.chartContainer.nativeElement.offsetHeight);
    });
  }
}
