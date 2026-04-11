import {
  AfterViewInit,
  Component,
  ComponentRef,
  inject,
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
import {WidgetStore, WidgetType} from '../../../core';

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
  @Input() isCenter = false;
  @ViewChild('anchor', {read: ViewContainerRef}) private anchor!: ViewContainerRef;

  private readonly widgetStore = inject(WidgetStore);

  readonly expandClick = output<void>();

  private compRef: ComponentRef<unknown> | null = null;
  private unsubscribers: (() => void)[] = [];
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.rebuild();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) return;
    if (changes['widgetType']) {
      this.rebuild();
    } else if (changes['isCenter'] && this.compRef && this.componentHasInput('isCenter')) {
      this.compRef.setInput('isCenter', this.isCenter);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribers.forEach(fn => fn());
  }

  private rebuild(): void {
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];
    this.anchor.clear();
    this.compRef = null;

    const compType = WIDGET_COMPONENT_MAP[this.widgetType];
    if (!compType) return;

    this.compRef = this.anchor.createComponent(compType as Type<unknown>);
    if (this.componentHasInput('widgetType')) {
      this.compRef.setInput('widgetType', this.widgetType);
    }
    if (this.componentHasInput('isCenter')) {
      this.compRef.setInput('isCenter', this.isCenter);
    }

    this.subscribeOutput('expandClick', () => this.expandClick.emit());
    this.subscribeOutput('removeClick', () => this.widgetStore.removeWidget(this.widgetType));
  }

  private componentHasInput(name: string): boolean {
    const cmpDef = (this.compRef?.componentType as {ɵcmp?: {inputs?: Record<string, unknown>}})?.ɵcmp;
    return !!cmpDef?.inputs && name in cmpDef.inputs;
  }

  private subscribeOutput(name: string, handler: () => void): void {
    const out = (this.compRef!.instance as Record<string, unknown>)[name];
    if (out && typeof (out as {subscribe?: unknown}).subscribe === 'function') {
      const sub = (out as {subscribe: (fn: () => void) => {unsubscribe?: () => void}}).subscribe(handler);
      this.unsubscribers.push(() => sub.unsubscribe?.());
    }
  }
}
