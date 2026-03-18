import {Component, inject, signal} from '@angular/core';
import {Sidebar} from '../../components/organism/sidebar/sidebar';
import {Filters} from '../../components/organism/filters/filters';
import {GapAnalysisSankey} from '../../components/organism/gap-analysis-sankey/gap-analysis-sankey';
import {Icon} from '../../components/atom/icon/icon';
import {LayoutService} from '../../core';

@Component({
  selector: 'app-gap-analysis',
  standalone: true,
  imports: [Sidebar, Filters, GapAnalysisSankey, Icon],
  templateUrl: './gap-analysis.html',
  styleUrl: './gap-analysis.scss',
})
export class GapAnalysisPage {
  readonly layoutMode = inject(LayoutService).layoutMode;

  readonly timelineYears = [2024, 2025, 2026];
  readonly quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  readonly selectedTimelineYear = signal(2026);
  readonly selectedQuarter = signal('Q4');
}
