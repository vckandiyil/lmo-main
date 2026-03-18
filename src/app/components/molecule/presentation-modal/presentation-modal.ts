import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {TranslateModule} from '@ngx-translate/core';
import {API_BASE_URL} from '../../../core/tokens/api-base-url.token';
import {LanguageService} from '../../../core';
import {TabGroup, TabItem} from '../../atom/tab-group/tab-group';
import {Button} from '../../atom/button/button';

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

@Component({
  selector: 'app-presentation-modal',
  standalone: true,
  imports: [TabGroup, Button, TranslateModule],
  templateUrl: './presentation-modal.html',
  styleUrl: './presentation-modal.scss'
})
export class PresentationModal implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly languageService = inject(LanguageService);

  protected readonly isArabic = this.languageService.isRtl;

  isOpen = input<boolean>(false);
  closed = output<void>();

  isClosing = signal(false);
  activeTab = signal('current');

  readonly tabs: TabItem[] = [
    {id: 'current', label: 'LMI.TAB_CURRENT'},
    {id: 'qq', label: 'LMI.TAB_QQ'},
    {id: 'yy', label: 'LMI.TAB_YY'}
  ];

  tableData: IndicatorRow[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.http.get<PresentationData>(`${this.baseUrl}/presentation.json`).subscribe({
      next: ({laborMarketPulse}) => {
        this.tableData = laborMarketPulse.indicators;
      },
      error: (err) => console.error('Failed to load presentation data:', err)
    });
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
