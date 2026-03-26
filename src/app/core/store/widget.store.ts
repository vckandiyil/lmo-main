import {inject} from '@angular/core';
import {signalStore, withState, withMethods, patchState} from '@ngrx/signals';
import {first} from 'rxjs';
import {Widget, SidebarPosition, WidgetType, createWidgetId} from '../models/widget.model';
import {WidgetCatalogService} from '../services/widget-catalog.service';


export interface WidgetState {
  leftWidgets: Widget[];
  rightWidgets: Widget[];
  centerWidget: WidgetType | null;
}

const initialState: WidgetState = {
  leftWidgets: [],
  rightWidgets: [],
  centerWidget: null,
};

export const WidgetStore = signalStore(
  { providedIn: 'root' },
  withState<WidgetState>(initialState),
  withMethods((store) => {
    const catalogService = inject(WidgetCatalogService);

    return {
      reorderWidgets(sidebar: SidebarPosition, previousIndex: number, currentIndex: number): void {
        const widgets = sidebar === 'left'
          ? [...store.leftWidgets()]
          : [...store.rightWidgets()];

        const [removed] = widgets.splice(previousIndex, 1);
        widgets.splice(currentIndex, 0, removed);

        if (sidebar === 'left') {
          patchState(store, { leftWidgets: widgets });
        } else {
          patchState(store, { rightWidgets: widgets });
        }
      },

      moveWidget(
        fromSidebar: SidebarPosition,
        toSidebar: SidebarPosition,
        previousIndex: number,
        currentIndex: number
      ): void {
        const sourceWidgets = fromSidebar === 'left'
          ? [...store.leftWidgets()]
          : [...store.rightWidgets()];

        const targetWidgets = toSidebar === 'left'
          ? [...store.leftWidgets()]
          : [...store.rightWidgets()];

        const [removed] = sourceWidgets.splice(previousIndex, 1);
        targetWidgets.splice(currentIndex, 0, removed);

        if (fromSidebar === 'left') {
          patchState(store, {
            leftWidgets: sourceWidgets,
            rightWidgets: targetWidgets
          });
        } else {
          patchState(store, {
            leftWidgets: targetWidgets,
            rightWidgets: sourceWidgets
          });
        }
      },

      resetToDefaults(): void {
        catalogService.getSidebarWidgets().pipe(first()).subscribe(widgets => {
          const mid = Math.ceil(widgets.length / 2);
          const leftWidgets  = widgets.slice(0, mid).map(w => ({id: createWidgetId(w.id as WidgetType), type: w.id as WidgetType}));
          const rightWidgets = widgets.slice(mid).map(w => ({id: createWidgetId(w.id as WidgetType), type: w.id as WidgetType}));
          patchState(store, {leftWidgets, rightWidgets});
        });
      },

      setWidgets(sidebar: SidebarPosition, widgetTypes: WidgetType[]): void {
        const selectedSet = new Set(widgetTypes);

        const currentTargetWidgets = sidebar === 'left'
          ? store.leftWidgets()
          : store.rightWidgets();

        const currentOtherWidgets = sidebar === 'left'
          ? store.rightWidgets()
          : store.leftWidgets();

        const existingSelected = currentTargetWidgets.filter(w => selectedSet.has(w.type));
        const existingTypes = new Set(existingSelected.map(w => w.type));

        const newWidgets: Widget[] = widgetTypes
          .filter(type => !existingTypes.has(type))
          .map(type => ({
            id: createWidgetId(type),
            type
          }));

        const targetWidgets = [...existingSelected, ...newWidgets];
        const otherWidgets = currentOtherWidgets.filter(w => !selectedSet.has(w.type));

        if (sidebar === 'left') {
          patchState(store, {
            leftWidgets: targetWidgets,
            rightWidgets: otherWidgets
          });
        } else {
          patchState(store, {
            leftWidgets: otherWidgets,
            rightWidgets: targetWidgets
          });
        }
      },

      setFourColLayout(left: Widget[], right: Widget[]): void {
        patchState(store, {leftWidgets: left, rightWidgets: right});
      },

      setTopicLayout(leftTypes: WidgetType[], rightTypes: WidgetType[]): void {
        const leftWidgets  = leftTypes.map(type  => ({id: createWidgetId(type),  type}));
        const rightWidgets = rightTypes.map(type => ({id: createWidgetId(type), type}));
        patchState(store, {leftWidgets, rightWidgets});
      },

      restoreFromCenter(): void {
        const centerType = store.centerWidget();
        if (!centerType) return;

        const leftWidgets = [...store.leftWidgets()];
        const rightWidgets = [...store.rightWidgets()];
        const leftIdx = leftWidgets.findIndex(w => w.type === WidgetType.Map);
        const rightIdx = rightWidgets.findIndex(w => w.type === WidgetType.Map);

        if (leftIdx >= 0) {
          leftWidgets.splice(leftIdx, 1, {id: createWidgetId(centerType), type: centerType});
          patchState(store, {leftWidgets, centerWidget: null});
        } else if (rightIdx >= 0) {
          rightWidgets.splice(rightIdx, 1, {id: createWidgetId(centerType), type: centerType});
          patchState(store, {rightWidgets, centerWidget: null});
        }
      },

      swapWithCenter(sidebar: SidebarPosition, index: number): void {
        const sidebarWidgets = sidebar === 'left'
          ? [...store.leftWidgets()]
          : [...store.rightWidgets()];

        const widget = sidebarWidgets[index];
        if (!widget) return;

        if (widget.type === WidgetType.Map) {
          // Map placeholder clicked → restore map to center, put center widget back in sidebar
          const currentCenter = store.centerWidget();
          if (!currentCenter) return;
          sidebarWidgets.splice(index, 1, {id: createWidgetId(currentCenter), type: currentCenter});
          patchState(store, {
            ...(sidebar === 'left' ? {leftWidgets: sidebarWidgets} : {rightWidgets: sidebarWidgets}),
            centerWidget: null,
          });
        } else {
          const currentCenter = store.centerWidget();

          if (currentCenter === null) {
            // Center is free → put Map placeholder where the widget was
            sidebarWidgets.splice(index, 1, {id: createWidgetId(WidgetType.Map), type: WidgetType.Map});
            patchState(store, {
              ...(sidebar === 'left' ? {leftWidgets: sidebarWidgets} : {rightWidgets: sidebarWidgets}),
              centerWidget: widget.type,
            });
          } else {
            // Center is occupied → return current center widget to the Map placeholder's slot,
            // put Map placeholder where the new widget is, set new widget as center
            let leftWidgets = [...store.leftWidgets()];
            let rightWidgets = [...store.rightWidgets()];

            // Find the current Map placeholder and replace it with the returning center widget
            const leftMapIdx = leftWidgets.findIndex(w => w.type === WidgetType.Map);
            const rightMapIdx = rightWidgets.findIndex(w => w.type === WidgetType.Map);
            if (leftMapIdx >= 0) {
              leftWidgets.splice(leftMapIdx, 1, {id: createWidgetId(currentCenter), type: currentCenter});
            } else if (rightMapIdx >= 0) {
              rightWidgets.splice(rightMapIdx, 1, {id: createWidgetId(currentCenter), type: currentCenter});
            }

            // Put Map placeholder where the new widget is
            if (sidebar === 'left') {
              leftWidgets.splice(index, 1, {id: createWidgetId(WidgetType.Map), type: WidgetType.Map});
            } else {
              rightWidgets.splice(index, 1, {id: createWidgetId(WidgetType.Map), type: WidgetType.Map});
            }

            patchState(store, {leftWidgets, rightWidgets, centerWidget: widget.type});
          }
        }
      },
    };
  })
);
