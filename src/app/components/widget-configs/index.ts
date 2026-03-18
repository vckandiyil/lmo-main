import {Type} from '@angular/core';
import {WidgetType} from '../../core/models/widget.model';

/**
 * Map from WidgetType to a fully custom detail component.
 * Widgets listed here bypass the generic WidgetDetailTemplate and
 * are rendered directly via NgComponentOutlet.
 */
export const WIDGET_DETAIL_COMPONENT_MAP: Partial<Record<WidgetType, Type<unknown>>> = {};

export const ALL_WIDGET_DETAIL_COMPONENTS = [] as const;
