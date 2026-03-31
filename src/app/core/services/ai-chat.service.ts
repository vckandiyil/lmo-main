import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import { AiChatApiResponse } from '../models/ai-chat.model';

// Set to true to use real backend, false for mock responses
const USE_MOCK = true;

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  sendMessage(query: string, chatId?: string): Observable<AiChatApiResponse> {
    if (USE_MOCK) {
      return of(this.getMockResponse(query, chatId)).pipe(delay(1400));
    }

    return this.http.post<AiChatApiResponse>(`${this.baseUrl}/chat`, {
      query,
      ...(chatId ? { chat_id: chatId } : {}),
    });
  }

  private getMockResponse(query: string, chatId?: string): AiChatApiResponse {
    const q = query.toLowerCase();
    const id = chatId ?? 'mock-chat-' + Math.random().toString(36).slice(2, 8);
    const wantsChart = /plot|chart|show|graph|visuali/.test(q);

    // Scenario 1 — unemployment rate with line chart
    if (/unemployment/.test(q) && wantsChart) {
      return {
        chat_id: id,
        message: {
          id: 'msg-' + Date.now(),
          content:
            'The unemployment rate in Al Ain shows moderate fluctuations. ' +
            'In Q1 2025 it stood at 3%, rising slightly to 4% in Q2, and reaching 4.1% in Q3. ' +
            'The annual rate for 2024 was 5%.',
        },
        status: 'complete',
        chart_desc: 'Unemployment rate trend for Al Ain region — 2025 quarterly data.',
        show_viz: true,
        custom_charts: [
          {
            name: 'Unemployment Rate – Al Ain (Quarterly)',
            data: [3, 4, 4.1],
            dashStyle: 'Solid',
            type: 'line',
            zIndex: 1,
            lineWidth: 2,
            color: '#3375C6',
            marker: { fillColor: '#3375C6', lineWidth: 1, lineColor: '#3375C6', symbol: 'circle', enabled: true },
            category: ['2025-Q1', '2025-Q2', '2025-Q3'],
            yAxisLabel: 'Unemployment Rate (%)',
            xAxisLabel: 'Quarter',
          },
        ],
        user_query: query,
      };
    }

    // Scenario 2 — unemployment rate text only (no chart keyword)
    if (/unemployment/.test(q)) {
      return {
        chat_id: id,
        message: {
          id: 'msg-' + Date.now(),
          content:
            'The unemployment rate in Al Ain for Q1 2025 was 3%, Q2 2025 was 4%, and Q3 2025 was 4.1%. ' +
            'The annual rate for 2024 was recorded at 5%. ' +
            'Overall the trend indicates a gradual increase through the year.',
        },
        status: 'complete',
        chart_desc: '',
        show_viz: true,
        custom_charts: [],
        user_query: query,
      };
    }

    // Scenario 3 — employment rate with bar chart
    if (/employment/.test(q)) {
      return {
        chat_id: id,
        message: {
          id: 'msg-' + Date.now(),
          content:
            'The employment rate in Abu Dhabi has been steadily increasing over the past five years, ' +
            'reaching 75.3% in 2024 — the highest recorded since 2020.',
        },
        status: 'complete',
        chart_desc: 'Employment rate trend in Abu Dhabi from 2020 to 2024.',
        show_viz: true,
        custom_charts: [
          {
            name: 'Employment Rate – Abu Dhabi',
            data: [68.5, 70.2, 72.1, 73.8, 75.3],
            dashStyle: 'Solid',
            type: 'column',
            zIndex: 1,
            lineWidth: 2,
            color: '#009e49',
            marker: { fillColor: '#009e49', lineWidth: 1, lineColor: '#009e49', symbol: 'circle', enabled: true },
            category: ['2020', '2021', '2022', '2023', '2024'],
            yAxisLabel: 'Employment Rate (%)',
            xAxisLabel: 'Year',
          },
        ],
        user_query: query,
      };
    }

    // Default — generic text response
    return {
      chat_id: id,
      message: {
        id: 'msg-' + Date.now(),
        content:
          'I can help you explore labour market data for the UAE. ' +
          'Try asking about unemployment rates, employment trends, or population figures. ' +
          'You can also ask me to plot any indicator.',
      },
      status: 'complete',
      chart_desc: '',
      show_viz: false,
      custom_charts: [],
      user_query: query,
    };
  }
}
