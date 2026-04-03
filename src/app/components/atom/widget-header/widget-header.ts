import {Component, computed, effect, ElementRef, HostListener, inject, input, output} from '@angular/core';
import {Icon} from '../icon/icon';
import {MoreMenu, MoreMenuItem} from '../more-menu/more-menu';
import {MoreMenuService} from '../../../shared/services/more-menu.service';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
  selector: 'app-widget-header',
  standalone: true,
  imports: [Icon, MoreMenu, MatTooltip],
  template: `
    <div class="widget-header">
      <span class="widget-header__title">{{ title() }}</span>
      <div class="widget-header__icons">
        @for (icon of icons(); track icon) {
          @if (icon === 'more') {
            <span class="widget-header__icon widget-header__icon--more" matTooltip="Dropdown" matTooltipPosition="above" (click)="toggleMore($event)">
              <app-icon name="more" size="18"/>
            </span>
            @if (moreOpen()) {
              <app-more-menu [items]="moreItems()" (itemClicked)="onMoreItemClicked($event)"/>
            }
          } @else if (icon === 'stars') {
            <span class="widget-header__icon" matTooltip="AI Insight" matTooltipPosition="above" (click)="onStarsClick($event)">
              <app-icon [name]="icon" size="18"/>
            </span>
          } @else if (icon === 'expand') {
            <span class="widget-header__icon" [matTooltip]="isCenter() ? 'Minimize' : 'Extended View'" matTooltipPosition="above" (click)="onExpandClick($event)">
              <app-icon class="widget-header__expand-icon" name="expand" size="18"/>
              <app-icon class="widget-header__collapse-icon" name="collapse" size="18"/>
            </span>
          } @else if (icon === 'stats-up-square') {
            <span class="widget-header__icon" matTooltip="Forecast" matTooltipPosition="above">
              <app-icon [name]="icon" size="18"/>
            </span>
          } @else {
            <span class="widget-header__icon">
              <app-icon [name]="icon" size="18"/>
            </span>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './widget-header.scss',
})
export class WidgetHeader {
  private static nextId = 0;

  readonly title = input.required<string>();
  readonly icons = input<string[]>(['stars', 'stats-up-square', 'more']);
  readonly isCenter = input(false);
  readonly moreItems = input<MoreMenuItem[]>([
    {icon: 'info-empty', label: 'HOME.MORE_INFORMATION'},
    {icon: 'forked-arrow', label: 'HOME.MORE_WHAT_IF'},
    {icon: 'download-data-window', label: 'HOME.MORE_DOWNLOAD'},
  ]);

  private readonly menuService = inject(MoreMenuService);
  private readonly id = `widget-header-${++WidgetHeader.nextId}`;

  readonly starsClick = output<void>();
  readonly expandClick = output<void>();
  readonly infoClick = output<void>();
  readonly downloadClick = output<void>();
  readonly chartTypeChange = output<string>();

  readonly moreOpen = computed(() => this.menuService.isOpen(this.id));

  constructor(private el: ElementRef) {
    effect(() => {
      const open = this.moreOpen();
      let node: HTMLElement | null = this.el.nativeElement;
      while (node && node.tagName?.toLowerCase() !== 'app-widget-card') {
        node = node.parentElement;
      }
      if (node) {
        node.style.zIndex = open ? '10' : '';
        node.style.position = open ? 'relative' : '';
      }
    });
  }

  onStarsClick(event: MouseEvent): void {
    event.stopPropagation();
    this.starsClick.emit();
  }

  onExpandClick(event: MouseEvent): void {
    event.stopPropagation();
    this.expandClick.emit();
  }

  toggleMore(event: MouseEvent): void {
    event.stopPropagation();
    this.moreOpen() ? this.menuService.close() : this.menuService.open(this.id);
  }

  onMoreItemClicked(item: MoreMenuItem): void {
    this.menuService.close();
    if (item.label === 'HOME.MORE_INFORMATION') {
      this.infoClick.emit();
    } else if (item.label === 'HOME.MORE_DOWNLOAD') {
      this.downloadClick.emit();
    } else if (item.value?.startsWith('chart-type:')) {
      this.chartTypeChange.emit(item.value.replace('chart-type:', ''));
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.moreOpen() && !this.el.nativeElement.contains(event.target)) {
      this.menuService.close();
    }
  }
}
