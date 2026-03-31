export interface AiChatMarker {
  fillColor: string;
  lineWidth: number;
  lineColor: string;
  symbol: string;
  enabled: boolean;
}

export interface AiChatCustomChart {
  name: string;
  data: number[];
  dashStyle: string;
  type: string;
  zIndex: number;
  lineWidth: number;
  color: string;
  marker: AiChatMarker;
  category: string[];
  yAxisLabel: string;
  xAxisLabel: string;
}

export interface AiChatApiResponse {
  chat_id: string;
  message: {
    id: string;
    content: string;
  };
  status: string;
  chart_desc: string;
  show_viz: boolean;
  custom_charts: AiChatCustomChart[];
  user_query: string;
}

export interface AiChatMessage {
  type: 'user' | 'assistant';
  content: string;
  response?: AiChatApiResponse;
  isError?: boolean;
}
