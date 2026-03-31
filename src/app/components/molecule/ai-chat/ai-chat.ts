import {
  AfterViewChecked,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Icon } from '../../atom/icon/icon';
import { animate, style, transition, trigger } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { AiChatService } from '../../../core/services/ai-chat.service';
import { AiChatCustomChart, AiChatMessage } from '../../../core/models/ai-chat.model';
import { ChartWrapper } from '../chart-wrapper/chart-wrapper';
import { ChartOptions } from '../../../shared/services/chart-config.service';
import { API_BASE_URL } from '../../../core/tokens/api-base-url.token';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [TranslateModule, Icon, ChartWrapper],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX({{from}})' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' })),
      ], { params: { from: '100%' } }),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX({{from}})' })),
      ], { params: { from: '100%' } }),
    ]),
  ],
})
export class AiChat implements OnInit, AfterViewChecked {
  private langService = inject(LanguageService);
  private aiChatService = inject(AiChatService);
  private translateService = inject(TranslateService);
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  @ViewChild('messageContainer') messageContainer?: ElementRef<HTMLElement>;

  isOpen = signal(false);
  isAnimating = signal(false);
  messages = signal<AiChatMessage[]>([]);
  inputValue = signal('');
  isLoading = signal(false);
  private chatId = signal<string | undefined>(undefined);
  private shouldScrollToBottom = false;

  animationParams = computed(() => ({
    value: 'open',
    params: { from: this.langService.isRtl() ? '-100%' : '100%' },
  }));

  hasMessages = computed(() => this.messages().length > 0);

  readonly suggestions = [
    'LMI.AI_SUGGESTION_1',
    'LMI.AI_SUGGESTION_2',
    'LMI.AI_SUGGESTION_3',
  ];

  ngOnInit(): void {
    this.http
      .get<AiChatMessage[]>(`${this.baseUrl}/ai-chat-example.json`)
      .subscribe(messages => {
        this.messages.set(messages);
        this.shouldScrollToBottom = true;
      });
  }

  toggle(): void {
    if (this.isAnimating()) return;
    this.isAnimating.set(true);
    this.isOpen.update((value) => !value);
    setTimeout(() => this.isAnimating.set(false), 300);
  }

  onSuggestionClick(key: string): void {
    this.inputValue.set(this.translateService.instant(key));
  }

  sendMessage(): void {
    const query = this.inputValue().trim();
    if (!query || this.isLoading()) return;

    this.messages.update(msgs => [...msgs, { type: 'user', content: query }]);
    this.inputValue.set('');
    this.isLoading.set(true);
    this.shouldScrollToBottom = true;

    this.aiChatService.sendMessage(query, this.chatId()).subscribe({
      next: (response) => {
        if (response.chat_id) this.chatId.set(response.chat_id);
        this.messages.update(msgs => [
          ...msgs,
          {
            type: 'assistant',
            content: response.message.content,
            response,
          },
        ]);
        this.isLoading.set(false);
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.messages.update(msgs => [
          ...msgs,
          { type: 'assistant', content: 'Something went wrong. Please try again.', isError: true },
        ]);
        this.isLoading.set(false);
        this.shouldScrollToBottom = true;
      },
    });
  }

  buildChartOptions(chart: AiChatCustomChart): ChartOptions {
    return {
      chart: { type: chart.type as any },
      title: { text: '' },
      xAxis: {
        categories: chart.category,
        title: { text: chart.xAxisLabel },
      },
      yAxis: {
        title: { text: chart.yAxisLabel },
      },
      series: [
        {
          name: chart.name,
          type: chart.type as any,
          data: chart.data,
          dashStyle: chart.dashStyle as any,
          zIndex: chart.zIndex,
          lineWidth: chart.lineWidth,
          color: chart.color,
          marker: chart.marker,
        } as any,
      ],
      legend: { enabled: false },
    };
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.messageContainer) {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
      this.shouldScrollToBottom = false;
    }
  }
}
