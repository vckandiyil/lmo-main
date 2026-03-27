import {Injectable, signal} from '@angular/core';
import {WidgetType} from '../models/widget.model';

@Injectable({providedIn: 'root'})
export class WidgetDetailService {
  readonly activeDetailWidget = signal<WidgetType | null>(null);
  private readonly chartTypeOverrides = signal<Record<string, string>>({});

  open(type: WidgetType): void {
    this.activeDetailWidget.set(type);
  }

  close(): void {
    this.activeDetailWidget.set(null);
  }

  setChartTypeOverride(widgetType: string, chartType: string): void {
    this.chartTypeOverrides.update(map => ({...map, [widgetType]: chartType}));
  }

  getChartTypeOverride(widgetType: string): string | null {
    return this.chartTypeOverrides()[widgetType] ?? null;
  }
}
