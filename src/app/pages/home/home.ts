import {AfterViewInit, Component, ElementRef, inject, NgZone, OnDestroy, OnInit, QueryList, signal, ViewChild, ViewChildren} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {DatePipe} from '@angular/common';
import {map} from 'rxjs';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {InlineSvg} from '../../components/atom/inline-svg/inline-svg';
import {Button} from '../../components/atom/button/button';
import {Icon} from '../../components/atom/icon/icon';
import {Dropdown} from '../../components/atom/dropdown/dropdown';
import {MarketEntrants} from '../../components/organism/market-entrants/market-entrants';
import {LaborForceComposition} from '../../components/organism/labor-force-composition/labor-force-composition';
import {AiInsights} from '../../components/organism/ai-insights/ai-insights';
import {Filters} from '../../components/organism/filters/filters';
import {RegionsOverview} from '../../components/organism/regions-overview/regions-overview';
import {DashboardDataService, LabourMarketPolicyEntry, NewsData} from '../../core/services/dashboard-data.service';
import {LanguageService} from '../../core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [InlineSvg, Button, Icon, Dropdown, MarketEntrants, LaborForceComposition, AiInsights, Filters, RegionsOverview, DatePipe, TranslateModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('timelineWrapper', {static: true}) timelineWrapper!: ElementRef<HTMLElement>;
  @ViewChild('timelineContent', {static: true}) timelineContent!: ElementRef<HTMLElement>;
  @ViewChild('timelineSection', {static: true}) timelineSection!: ElementRef<HTMLElement>;

  @ViewChildren(Dropdown) dropdowns!: QueryList<Dropdown>;

  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly el = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  protected readonly isArabic = this.languageService.isRtl;

  protected readonly citizenshipOptions = toSignal(
    this.translate.stream(['HOME.EMIRATI', 'HOME.NON_EMIRATI']).pipe(
      map(t => [t['HOME.EMIRATI'], t['HOME.NON_EMIRATI']])
    ),
    {initialValue: ['Emirati', 'Non-Emirati']}
  );

  protected readonly workSectorOptions = toSignal(
    this.translate.stream(['HOME.PUBLIC', 'HOME.PRIVATE', 'HOME.SEMI_GOVERNMENT']).pipe(
      map(t => [t['HOME.PUBLIC'], t['HOME.PRIVATE'], t['HOME.SEMI_GOVERNMENT']])
    ),
    {initialValue: ['Public', 'Private', 'Semi-Government']}
  );

  protected readonly genderOptions = toSignal(
    this.translate.stream(['HOME.MALE', 'HOME.FEMALE']).pipe(
      map(t => [t['HOME.MALE'], t['HOME.FEMALE']])
    ),
    {initialValue: ['Male', 'Female']}
  );

  protected readonly regionOptions = toSignal(
    this.translate.stream(['HOME.REGION_ABU_DHABI', 'HOME.REGION_AL_AIN', 'HOME.REGION_AL_DHAFRA']).pipe(
      map(t => [t['HOME.REGION_ABU_DHABI'], t['HOME.REGION_AL_AIN'], t['HOME.REGION_AL_DHAFRA']])
    ),
    {initialValue: ['Abu Dhabi', 'Al Ain', 'Al Dhafra']}
  );

  protected timelineRows = signal<LabourMarketPolicyEntry[][]>([]);
  protected newsData = signal<NewsData | null>(null);

  private scrollListener?: () => void;
  private resizeObserver?: ResizeObserver;
  private updateTimelineHeight?: () => void;

  ngOnInit(): void {
    this.dashboardDataService.getLabourMarketPolicies().subscribe({
      next: (data) => {
        this.timelineRows.set(data);
        setTimeout(() => this.updateTimelineHeight?.(), 0);
      },
      error: (err) => console.error('Failed to load labour market policies:', err),
    });

    this.dashboardDataService.getNews().subscribe({
      next: (data) => this.newsData.set(data),
      error: (err) => console.error('Failed to load news:', err),
    });
  }

  ngAfterViewInit(): void {
    const host = this.el.nativeElement as HTMLElement;
    const wrapper = this.timelineWrapper.nativeElement;
    const content = this.timelineContent.nativeElement;
    const section = this.timelineSection.nativeElement;

    const scrollRatio = 0.3;

    const update = () => {
      const horizontalScroll = content.scrollWidth - content.clientWidth;
      wrapper.style.height = `${section.offsetHeight + horizontalScroll * scrollRatio}px`;
      section.style.setProperty('--timeline-height', `${section.offsetHeight}px`);
    };

    this.updateTimelineHeight = update;
    update();

    this.resizeObserver = new ResizeObserver(() => update());
    this.resizeObserver.observe(content);

    this.ngZone.runOutsideAngular(() => {
      this.scrollListener = () => {
        const horizontalScroll = content.scrollWidth - content.clientWidth;
        const scrollProgress = host.scrollTop - wrapper.offsetTop;
        content.scrollLeft = Math.max(0, Math.min(scrollProgress / scrollRatio, horizontalScroll));
      };
      host.addEventListener('scroll', this.scrollListener, {passive: true});
    });
  }

  protected resetFilters(): void {
    this.dropdowns.forEach(d => d.reset());
  }

  ngOnDestroy(): void {
    if (this.scrollListener) {
      this.el.nativeElement.removeEventListener('scroll', this.scrollListener);
    }
    this.resizeObserver?.disconnect();
  }
}
