import {Component, computed, inject, input, OnInit, output, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {TranslateModule} from '@ngx-translate/core';
import {API_BASE_URL} from '../../../core/tokens/api-base-url.token';
import {LanguageService, ThemeService} from '../../../core';
import {TabGroup, TabItem} from '../../atom/tab-group/tab-group';
import {Button} from '../../atom/button/button';
import {Icon} from '../../atom/icon/icon';

interface YYData {
  overall: number;
  alDhafra: number;
  abuDhabi: number;
  alAin: number;
}

interface IndicatorRow {
  domain: string;
  domain_ar?: string;
  overall: string;
  alDhafra: string;
  abuDhabi: string;
  alAin: string;
  yy: YYData;
}

interface PresentationData {
  laborMarketPulse: {
    indicators: IndicatorRow[];
  };
}

interface CatalogWidget {
  id: string;
  title: string;
  hidden?: boolean;
}

interface WidgetsCatalog {
  widgets: CatalogWidget[];
}

@Component({
  selector: 'app-presentation-modal',
  standalone: true,
  imports: [TabGroup, Button, Icon, TranslateModule],
  templateUrl: './presentation-modal.html',
  styleUrl: './presentation-modal.scss'
})
export class PresentationModal implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly languageService = inject(LanguageService);
  private readonly themeService = inject(ThemeService);

  protected readonly isArabic = this.languageService.isRtl;
  protected readonly closeIconColor = computed(() => this.themeService.isDarkMode() ? '#9BA8B7' : '#37516E');

  isOpen = input<boolean>(false);
  closed = output<void>();
  downloadReport = output<void>();

  isClosing = signal(false);
  activeTab = signal('current');
  isIndicatorPopupOpen = signal(false);
  private selectedIds = signal(new Set<string>());
  readonly selectedIndicatorIds = computed(() => this.selectedIds());

  readonly tabs: TabItem[] = [
    {id: 'current', label: 'LMI.TAB_CURRENT'},
    {id: 'qq', label: 'LMI.TAB_QQ'},
    {id: 'yy', label: 'LMI.TAB_YY'}
  ];

  tableData: IndicatorRow[] = [];
  availableIndicators: CatalogWidget[] = [];

  readonly popupIndicators: string[] = [
    'Female Labor Force Participation',
    'Employment-to-Population Ratio',
    'Labor Force Growth',
    'New Labor Market Entrants',
    'Private Sector Employment Share',
    'Public Sector Employment Share',
    'Part-Time Employment Share',
    'Temporary / Contract Employment Share',
    'Workforce by High-Skilled Occupations',
    'Employment Growth',
    'Vacancy Fill Rate',
    'Time to Fill Vacancy',
    'Skill Shortage Index',
    'Job Placement Rate',
    'Median Monthly Salary',
    'Real Wage Growth',
    'Underemployment Rate',
    'Emiratization Rate',
    'Long-Term Unemployment Share',
  ];

  ngOnInit(): void {
    this.loadData();
    this.loadCatalog();
  }

  private loadData(): void {
    this.http.get<PresentationData>(`${this.baseUrl}/presentation.json`).subscribe({
      next: ({laborMarketPulse}) => {
        this.tableData = laborMarketPulse.indicators;
      },
      error: (err) => console.error('Failed to load presentation data:', err)
    });
  }

  private loadCatalog(): void {
    this.http.get<WidgetsCatalog>(`${this.baseUrl}/widgets-catalog.json`).subscribe({
      next: ({widgets}) => {
        this.availableIndicators = widgets.filter(w => !w.hidden && w.id !== 'map');
      },
      error: (err) => console.error('Failed to load widget catalog:', err)
    });
  }

  toggleIndicatorPopup(): void {
    this.isIndicatorPopupOpen.update(v => !v);
  }

  closeIndicatorPopup(): void {
    this.isIndicatorPopupOpen.set(false);
    this.selectedIds.set(new Set());
  }

  toggleIndicator(id: string): void {
    this.selectedIds.update(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  addSelectedIndicators(): void {
    // TODO: handle adding selected indicators to the table
    this.closeIndicatorPopup();
  }

  onDownloadReport(): void {
    this.downloadReport.emit();
  }

  onTabChanged(tabId: string): void {
    this.activeTab.set(tabId);
  }

  onBackdropClick(): void {
    this.close();
  }

  onContentClick(event: Event): void {
    event.stopPropagation();
  }

  close(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      this.isClosing.set(false);
      this.closed.emit();
    }, 300);
  }
}
