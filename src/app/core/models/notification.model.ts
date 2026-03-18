export type NotificationType = 'positive' | 'negative';

export interface Notification {
  id: string;
  created_date: string;
  type: NotificationType;
  message: string;
  message_ar?: string;
}

export interface NotificationGroup {
  month: string;
  notifications: Notification[];
}
