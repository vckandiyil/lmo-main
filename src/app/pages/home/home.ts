import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {InlineSvg} from '../../components/atom/inline-svg/inline-svg';
import {Button} from '../../components/atom/button/button';
import {Icon} from '../../components/atom/icon/icon';
import {LaborForceComposition} from '../../components/organism/labor-force-composition/labor-force-composition';
import {WorkforceStructure} from '../../components/organism/workforce-structure/workforce-structure';
import {AiInsights} from '../../components/organism/ai-insights/ai-insights';
import {Filters} from '../../components/organism/filters/filters';
import {LmiBar} from '../../components/organism/lmi-bar/lmi-bar';
import {RegionProfile} from '../../components/organism/region-profile/region-profile';
import {RegionsOverview} from '../../components/organism/regions-overview/regions-overview';
import {DashboardDataService, LabourMarketPolicyEntry, NewsData} from '../../core/services/dashboard-data.service';
import {LanguageService} from '../../core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [InlineSvg, Button, Icon, LaborForceComposition, WorkforceStructure, AiInsights, Filters, LmiBar, RegionProfile, RegionsOverview, DatePipe, TranslateModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly languageService = inject(LanguageService);

  protected readonly isArabic = this.languageService.isRtl;

  protected readonly selectedRegions = signal<Set<string>>(new Set());
  protected readonly hasSelection = computed(() => this.selectedRegions().size > 0);

  protected isRegionSelected(region: string): boolean {
    return this.selectedRegions().has(region);
  }

  protected toggleRegion(region: string): void {
    this.selectedRegions.update(prev => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  }

  protected timelineRows = signal<LabourMarketPolicyEntry[][]>([]);
  protected newsData = signal<NewsData | null>(null);

  ngOnInit(): void {
    this.dashboardDataService.getLabourMarketPolicies().subscribe({
      next: (data) => this.timelineRows.set(data),
      error: (err) => console.error('Failed to load labour market policies:', err),
    });

    this.dashboardDataService.getNews().subscribe({
      next: (data) => this.newsData.set(data),
      error: (err) => console.error('Failed to load news:', err),
    });
  }
}
