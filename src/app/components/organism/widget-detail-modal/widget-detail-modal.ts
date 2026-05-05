import {Component, computed, inject, input, output, signal} from '@angular/core';
import {NgComponentOutlet} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {WidgetType} from '../../../core';
import {WidgetDetailConfigService} from '../../../core/services/widget-detail-config.service';
import {WidgetDetailService} from '../../../core/services/widget-detail.service';
import {Icon} from '../../atom/icon/icon';
import {FilterBar, FilterValues} from '../../molecule/filter-bar/filter-bar';
import {WidgetDetailTemplate} from '../widget-detail-template/widget-detail-template';
import {ALL_WIDGET_DETAIL_COMPONENTS, WIDGET_DETAIL_COMPONENT_MAP} from '../../widget-configs/index';

@Component({
  selector: 'app-widget-detail-modal',
  standalone: true,
  imports: [Icon, FilterBar, NgComponentOutlet, WidgetDetailTemplate, ...ALL_WIDGET_DETAIL_COMPONENTS],
  templateUrl: './widget-detail-modal.html',
  styleUrl: './widget-detail-modal.scss'
})
export class WidgetDetailModal {
  private readonly widgetDetailConfigService = inject(WidgetDetailConfigService);
  private readonly widgetDetailService       = inject(WidgetDetailService);

  readonly isOpen    = input<boolean>(false);
  readonly widgetType = input<WidgetType | null>(null);
  readonly closed    = output<void>();

  readonly isClosing = signal(false);

  private readonly allConfigs = toSignal(
    this.widgetDetailConfigService.allConfigs$,
    {initialValue: null},
  );

  readonly activeFilters = computed(() => {
    const type    = this.widgetType();
    const configs = this.allConfigs();
    return type && configs ? (configs.filterMap[type] ?? []) : [];
  });

  readonly detailComponent = computed(() => {
    const type = this.widgetType();
    return type ? (WIDGET_DETAIL_COMPONENT_MAP[type] ?? null) : null;
  });

  readonly detailConfig = computed(() => {
    const type    = this.widgetType();
    const configs = this.allConfigs();
    return type && configs ? (configs.configMap.get(type) ?? null) : null;
  });

  readonly initialChartType = computed(() => {
    const type = this.widgetType();
    return type ? this.widgetDetailService.getChartTypeOverride(type) : null;
  });

  onFiltersApplied(_values: FilterValues): void {
    // handle filter changes
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
      this.closed.emit();
      this.isClosing.set(false);
    }, 300);
  }
}
