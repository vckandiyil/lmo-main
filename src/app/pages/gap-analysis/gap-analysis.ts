import {Component, inject, OnInit} from '@angular/core';
import {Sidebar} from '../../components/organism/sidebar/sidebar';
import {Filters} from '../../components/organism/filters/filters';
import {GapAnalysisCenter} from '../../components/organism/gap-analysis-center/gap-analysis-center';
import {LayoutService, WidgetStore} from '../../core';
import {LmiBar} from '../../components/organism/lmi-bar/lmi-bar';

@Component({
  selector: 'app-gap-analysis',
  standalone: true,
  imports: [Sidebar, Filters, GapAnalysisCenter, LmiBar],
  templateUrl: './gap-analysis.html',
  styleUrl: './gap-analysis.scss',
})
export class GapAnalysisPage implements OnInit {
  readonly layoutMode = inject(LayoutService).layoutMode;
  private readonly widgetStore = inject(WidgetStore);

  ngOnInit(): void {
    this.widgetStore.clearWidgets();
  }
}
