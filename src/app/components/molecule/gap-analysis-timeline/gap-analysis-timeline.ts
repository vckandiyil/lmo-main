import {Component, input, output} from '@angular/core';
import {Icon} from '../../atom/icon/icon';

@Component({
  selector: 'app-gap-analysis-timeline',
  standalone: true,
  imports: [Icon],
  templateUrl: './gap-analysis-timeline.html',
  styleUrl: './gap-analysis-timeline.scss',
})
export class GapAnalysisTimeline {
  readonly selectedYear    = input<number>(2026);
  readonly selectedQuarter = input<string>('Q4');
  readonly fullscreen      = input<boolean>(false);
  readonly yearChange      = output<number>();
  readonly quarterChange   = output<string>();
  readonly fullscreenToggle = output<void>();

  readonly years    = [2024, 2025, 2026];
  readonly quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
}
