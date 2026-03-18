import {Component, computed, inject, input, output, signal} from '@angular/core';
import {NgComponentOutlet} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {WidgetType} from '../../../core';
import {WidgetDetailConfigService} from '../../../core/services/widget-detail-config.service';
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
      this.isClosing.set(false);
      this.closed.emit();
    }, 300);
  }
}
