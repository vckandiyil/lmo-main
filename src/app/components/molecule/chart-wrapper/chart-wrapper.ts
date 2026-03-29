import {
  Component,
  Input,
  AfterViewInit,
  ElementRef,
  ViewChild,
  NgZone,
  inject,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import * as Highcharts from 'highcharts';
import {ChartConfigService, ChartOptions} from '../../../shared/services/chart-config.service';

@Component({
  selector: 'app-chart-wrapper',
  standalone: true,
  template: `
    <div #container class="chart-container"></div>`,
  styleUrl: './chart-wrapper.scss',
})
export class ChartWrapper implements AfterViewInit, OnChanges, OnDestroy {
  @Input() options: ChartOptions = {};

  @ViewChild('container', {static: true}) container!: ElementRef;

  private chart!: Highcharts.Chart;
  private created = false;
  private creating = false;
  private updateTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly ngZone = inject(NgZone);
  private readonly chartConfigService = inject(ChartConfigService);

  ngAfterViewInit(): void {
    this.tryCreateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.created) {
      const prevType = (changes['options'].previousValue as ChartOptions)?.chart?.type;
      const nextType = (changes['options'].currentValue  as ChartOptions)?.chart?.type;
      const crossesPieBoundary = (prevType === 'pie') !== (nextType === 'pie');

      if (crossesPieBoundary) {
        // Pie ↔ cartesian transitions can't be handled via update() — recreate
        if (this.updateTimeoutId) {
          clearTimeout(this.updateTimeoutId);
          this.updateTimeoutId = null;
        }
        this.ngZone.runOutsideAngular(() => {
          this.chart.destroy();
        });
        this.created = false;
        this.creating = false;
        this.tryCreateChart();
        return;
      }

      // Debounce updates - cancel pending update if options change again
      if (this.updateTimeoutId) {
        clearTimeout(this.updateTimeoutId);
      }
      // Use setTimeout(0) to yield to browser and prevent UI blocking
      this.updateTimeoutId = setTimeout(() => {
        this.updateTimeoutId = null;
        this.ngZone.runOutsideAngular(() => {
          const merged = this.chartConfigService.mergeOptions(this.options);
          // Strip all animation from updates so theme switches / data changes
          // are instant (the grow-in animation only runs on initial creation).
          const {animation: _ca, ...chartRest} = (merged.chart ?? {}) as any;
          const {series: seriesPlot, ...restPlot} = (merged.plotOptions ?? {}) as any;
          const {animation: _sa, ...seriesPlotRest} = (seriesPlot ?? {}) as any;
          const mergedForUpdate = {
            ...merged,
            chart: chartRest,
            plotOptions: {...restPlot, series: seriesPlotRest},
          };
          this.chart.update(mergedForUpdate as Highcharts.Options, true, true, false);
        });
      }, 0);
    }

    this.tryCreateChart();
  }

  private tryCreateChart() {
    if (this.created || this.creating) return;
    if (!this.options || Object.keys(this.options).length === 0) return;

    this.creating = true;

    // Use RAF to ensure DOM is ready before creating chart with animation
    requestAnimationFrame(() => {
      if (this.created) {
        this.creating = false;
        return;
      }

      const merged = this.chartConfigService.mergeOptions(this.options);

      this.ngZone.runOutsideAngular(() => {
        this.chart = Highcharts.chart(
          this.container.nativeElement,
          merged as Highcharts.Options
        );
        this.created = true;
        this.creating = false;
      });
    });
  }

  ngOnDestroy(): void {
    if (this.updateTimeoutId) {
      clearTimeout(this.updateTimeoutId);
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
