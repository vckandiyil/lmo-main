import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {API_BASE_URL} from '../../../core/tokens/api-base-url.token';
import {Badge} from '../../atom/badge/badge';
import {Icon} from '../../atom/icon/icon';

interface LmiTickerItem {
  domain: string;
  overall: string;
  yyOverall: number;
}

@Component({
  selector: 'app-lmi-bar',
  standalone: true,
  imports: [Badge, Icon],
  templateUrl: './lmi-bar.html',
  styleUrl: './lmi-bar.scss',
})
export class LmiBar implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  items = signal<LmiTickerItem[]>([]);

  // 3 copies per half so one half always exceeds any realistic viewport width
  halfItems = computed(() => {
    const arr = this.items();
    return [...arr, ...arr, ...arr];
  });

  ngOnInit(): void {
    this.http.get<any>(`${this.baseUrl}/presentation.json`).subscribe({
      next: ({laborMarketPulse}) => {
        this.items.set(
          laborMarketPulse.indicators.map((ind: any) => ({
            domain: ind.domain,
            overall: ind.overall,
            yyOverall: ind.yy.overall,
          }))
        );
      },
      error: (err) => console.error('Failed to load lmi-bar data:', err),
    });
  }
}
