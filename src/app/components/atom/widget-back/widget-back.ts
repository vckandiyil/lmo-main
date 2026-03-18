import {Component, inject, input, output} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {of, switchMap} from 'rxjs';
import {TranslateModule} from '@ngx-translate/core';
import {Icon} from '../icon/icon';
import {WidgetAiInsightService} from '../../../core/services/widget-ai-insight.service';

@Component({
  selector: 'app-widget-back',
  standalone: true,
  imports: [Icon, TranslateModule],
  template: `
    <div class="widget-back">
      <div class="widget-back__header">
        <div class="widget-back__title-group">
          <app-icon name="stars" size="18" color="#3375C6"/>
          <span class="widget-back__title">{{ 'HOME.AI_INSIGHT' | translate }}</span>
        </div>
        <span class="widget-back__close" (click)="onClose($event)">
          <app-icon name="delete-circle" size="22" color="#AEB2BC"/>
        </span>
      </div>
      <div class="widget-back__content">{{ text() }}</div>
    </div>
  `,
  styleUrl: './widget-back.scss',
})
export class WidgetBack {
  readonly widgetType = input<string>('');
  readonly close = output<void>();

  private readonly aiInsightService = inject(WidgetAiInsightService);

  private readonly text$ = toObservable(this.widgetType).pipe(
    switchMap(type => type ? this.aiInsightService.getText(type) : of('')),
  );
  readonly text = toSignal(this.text$, {initialValue: ''});

  onClose(event: MouseEvent): void {
    event.stopPropagation();
    this.close.emit();
  }
}
