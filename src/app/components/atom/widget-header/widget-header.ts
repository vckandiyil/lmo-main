import {Component, computed, ElementRef, HostListener, inject, input, output} from '@angular/core';
import {Icon} from '../icon/icon';
import {MoreMenu, MoreMenuItem} from '../more-menu/more-menu';
import {MoreMenuService} from '../../../shared/services/more-menu.service';

@Component({
  selector: 'app-widget-header',
  standalone: true,
  imports: [Icon, MoreMenu],
  template: `
    <div class="widget-header">
      <span class="widget-header__title">{{ title() }}</span>
      <div class="widget-header__icons">
        @for (icon of icons(); track icon) {
          @if (icon === 'more') {
            <span class="widget-header__icon widget-header__icon--more" (click)="toggleMore($event)">
              <app-icon name="more" size="18" color="#AEB2BC"/>
            </span>
            @if (moreOpen()) {
              <app-more-menu [items]="moreItems()"/>
            }
          } @else if (icon === 'stars') {
            <span class="widget-header__icon" (click)="onStarsClick($event)">
              <app-icon [name]="icon" size="18" color="#AEB2BC"/>
            </span>
          } @else if (icon === 'expand') {
            <span class="widget-header__icon" (click)="onExpandClick($event)">
              <app-icon class="widget-header__expand-icon" name="expand" size="18" color="#AEB2BC"/>
              <app-icon class="widget-header__collapse-icon" name="collapse" size="18" color="#AEB2BC"/>
            </span>
          } @else {
            <span class="widget-header__icon">
              <app-icon [name]="icon" size="18" color="#AEB2BC"/>
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
  readonly icons = input<string[]>(['stars', 'stats-up-square', 'expand', 'more']);
  readonly moreItems = input<MoreMenuItem[]>([
    {icon: 'info-empty', label: 'HOME.MORE_INFORMATION'},
    {icon: 'settings', label: 'HOME.MORE_SETTINGS'},
    {icon: 'forked-arrow', label: 'HOME.MORE_WHAT_IF'},
    {icon: 'download-data-window', label: 'HOME.MORE_DOWNLOAD'},
  ]);

  private readonly menuService = inject(MoreMenuService);
  private readonly id = `widget-header-${++WidgetHeader.nextId}`;

  readonly starsClick = output<void>();
  readonly expandClick = output<void>();

  readonly moreOpen = computed(() => this.menuService.isOpen(this.id));

  constructor(private el: ElementRef) {}

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.moreOpen() && !this.el.nativeElement.contains(event.target)) {
      this.menuService.close();
    }
  }
}
