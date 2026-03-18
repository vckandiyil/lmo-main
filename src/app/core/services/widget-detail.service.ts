import {Injectable, signal} from '@angular/core';
import {WidgetType} from '../models/widget.model';

@Injectable({providedIn: 'root'})
export class WidgetDetailService {
  readonly activeDetailWidget = signal<WidgetType | null>(null);

  open(type: WidgetType): void {
    this.activeDetailWidget.set(type);
  }

  close(): void {
    this.activeDetailWidget.set(null);
  }
}
