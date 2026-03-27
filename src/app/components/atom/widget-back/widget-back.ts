import {Component, computed, inject, input, output, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {of, switchMap} from 'rxjs';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {Icon} from '../icon/icon';
import {WidgetAiInsightService} from '../../../core/services/widget-ai-insight.service';
import {LanguageService} from '../../../core/services/language.service';
import {DOWNLOAD_FORMATS} from '../../../core/constants/download.constants';

@Component({
  selector: 'app-widget-back',
  standalone: true,
  imports: [Icon, TranslateModule],
  template: `
    <div class="widget-back">
      <div class="widget-back__header">
        <div class="widget-back__title-group">
          @if (mode() === 'info') {
            <app-icon name="code-brackets-square" size="18" color="#3375C6"/>
            <span class="widget-back__title widget-back__title--info">{{ 'LMI.STATISTICAL_METADATA' | translate }}</span>
          } @else if (mode() === 'download') {
            <app-icon name="download" size="18" color="#3375C6"/>
            <span class="widget-back__title">{{ 'HOME.MORE_DOWNLOAD' | translate }}</span>
          } @else {
            <app-icon name="stars" size="18" color="#3375C6"/>
            <span class="widget-back__title">{{ 'HOME.AI_INSIGHT' | translate }}</span>
          }
        </div>
        <span class="widget-back__close" (click)="onClose($event)">
          <app-icon name="delete-circle" size="22" color="#AEB2BC"/>
        </span>
      </div>
      @if (mode() === 'info') {
        <ul class="widget-back__meta-list">
          @for (item of statisticalItems(); track item.label) {
            <li class="widget-back__meta-item">{{ item.label }}: {{ item.value }}</li>
          }
        </ul>
      } @else if (mode() === 'download') {
        <div class="widget-back__download" (click)="$event.stopPropagation()">
          <div class="widget-back__download-formats">
            @for (format of downloadFormats; track format.id) {
              <div class="widget-back__download-format">
                <div class="widget-back__download-format-icon" [style.background-color]="format.color">
                  <app-icon [name]="format.icon" [color]="format.iconColor" size="16"></app-icon>
                </div>
                <span class="widget-back__download-format-label">{{ format.label }}</span>
              </div>
            }
          </div>
          <label class="widget-back__checkbox">
            <input type="checkbox" [checked]="termsAccepted()" (change)="toggleTerms()">
            <span class="widget-back__checkbox-mark"></span>
            {{ 'LMI.TERMS_AGREE' | translate }} <strong>{{ 'LMI.TERMS_CONDITIONS' | translate }}</strong>
          </label>
        </div>
      } @else {
        <div class="widget-back__content">{{ text() }}</div>
      }
    </div>
  `,
  styleUrl: './widget-back.scss',
})
export class WidgetBack {
  readonly widgetType   = input<string>('');
  readonly mode         = input<'ai' | 'info' | 'download'>('ai');
  readonly indicatorName = input<string>('');
  readonly unit          = input<string>('');
  readonly updatedDate   = input<string>('');
  readonly periodicity   = input<string>('');
  readonly close = output<void>();

  readonly downloadFormats = DOWNLOAD_FORMATS;
  readonly termsAccepted = signal(false);

  private readonly aiInsightService = inject(WidgetAiInsightService);
  private readonly translate        = inject(TranslateService);
  private readonly languageService  = inject(LanguageService);

  private readonly isArabic = this.languageService.isRtl;

  private readonly text$ = toObservable(this.widgetType).pipe(
    switchMap(type => type ? this.aiInsightService.getText(type) : of('')),
  );
  readonly text = toSignal(this.text$, {initialValue: ''});

  readonly statisticalItems = computed(() => {
    this.isArabic(); // track language changes

    const periodicity  = this.periodicity();
    const timeCoverage = periodicity ? `${periodicity} data` : '';

    const raw = this.updatedDate();
    let formattedDate = raw;
    if (raw) {
      const date = new Date(raw);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'});
      }
    }

    return [
      {label: this.translate.instant('LMI.INDICATOR_NAME'), value: this.indicatorName()},
      {label: this.translate.instant('LMI.METRIC_UNIT'),    value: this.unit()},
      {label: this.translate.instant('LMI.TIME_COVERAGE'),  value: timeCoverage},
      {label: this.translate.instant('LMI.UPDATED_DATE'),   value: formattedDate},
      {label: this.translate.instant('LMI.SOURCE'),         value: 'SCAD'},
    ].filter(item => !!item.value);
  });

  toggleTerms(): void {
    this.termsAccepted.update(v => !v);
  }

  onClose(event: MouseEvent): void {
    event.stopPropagation();
    this.close.emit();
  }
}
