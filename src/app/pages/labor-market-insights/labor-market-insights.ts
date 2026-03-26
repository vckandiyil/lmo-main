import {Component, inject} from '@angular/core';
import {Sidebar} from '../../components/organism/sidebar/sidebar';
import {Filters} from '../../components/organism/filters/filters';
import {CenterSection} from '../../components/organism/center-section/center-section';
import {LayoutService} from '../../core';
import {LmiBar} from '../../components/organism/lmi-bar/lmi-bar';

@Component({
  selector: 'app-labor-market-insights',
  standalone: true,
  imports: [Sidebar, Filters, CenterSection, LmiBar],
  templateUrl: './labor-market-insights.html',
  styleUrl: './labor-market-insights.scss',
})
export class LaborMarketInsightsPage {
  readonly layoutMode = inject(LayoutService).layoutMode;
}
