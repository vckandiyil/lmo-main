import {
  AfterViewInit,
  Component,
  ComponentRef,
  Input,
  OnChanges,
  OnDestroy,
  output,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {WIDGET_COMPONENT_MAP} from '../widgets';
import {WidgetType} from '../../../core';

/**
 * Renders any custom widget dynamically by type, forwarding its expandClick output.
 * Uses ViewContainerRef.createComponent() directly to avoid NgComponentOutlet's
 * lack of output support in Angular 20.
 */
@Component({
  selector: 'app-dynamic-widget',
  standalone: true,
  template: '<ng-container #anchor/>',
})
export class DynamicWidget implements AfterViewInit, OnChanges, OnDestroy {
  @Input({required: true}) widgetType!: WidgetType;
  @ViewChild('anchor', {read: ViewContainerRef}) private anchor!: ViewContainerRef;

  readonly expandClick = output<void>();

  private compRef: ComponentRef<unknown> | null = null;
  private unsubscribe: (() => void) | null = null;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.rebuild();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady && changes['widgetType']) {
      this.rebuild();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  private rebuild(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.anchor.clear();
    this.compRef = null;

    const compType = WIDGET_COMPONENT_MAP[this.widgetType];
    if (!compType) return;

    this.compRef = this.anchor.createComponent(compType as Type<unknown>);
    this.compRef.setInput('widgetType', this.widgetType);

    const expandOut = (this.compRef.instance as Record<string, unknown>)['expandClick'];
    if (expandOut && typeof (expandOut as {subscribe?: unknown}).subscribe === 'function') {
      const sub = (expandOut as {subscribe: (fn: () => void) => {unsubscribe?: () => void}}).subscribe(
        () => this.expandClick.emit()
      );
      this.unsubscribe = () => sub.unsubscribe?.();
    }
  }
}
