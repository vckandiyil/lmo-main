import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {TranslateModule} from '@ngx-translate/core';
import {MoreMenu, MoreMenuItem} from './more-menu';
import {API_BASE_URL} from '../../../core/tokens/api-base-url.token';

describe('MoreMenu', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoreMenu, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: API_BASE_URL, useValue: 'http://localhost'},
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MoreMenu);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render menu items', async () => {
    const fixture = TestBed.createComponent(MoreMenu);
    const items: MoreMenuItem[] = [
      {icon: 'info-empty', label: 'Info'},
      {icon: 'download', label: 'Download'},
    ];
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
    fixture.detectChanges();

    const menuItems = fixture.nativeElement.querySelectorAll('.more-menu__item');
    expect(menuItems.length).toBe(2);
  });

  it('should apply expandable class when item has children', async () => {
    const fixture = TestBed.createComponent(MoreMenu);
    const items: MoreMenuItem[] = [
      {
        icon: 'graph-up',
        label: 'Chart Types',
        children: [
          {icon: 'graph-up', label: 'Line', value: 'chart-type:line'},
          {icon: 'stats-up-square', label: 'Bar', value: 'chart-type:bar'},
        ],
      },
    ];
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
    fixture.detectChanges();

    const menuItem = fixture.nativeElement.querySelector('.more-menu__item');
    expect(menuItem.classList.contains('more-menu__item--expandable')).toBe(true);
  });

  it('should NOT apply expandable class when item has no children', async () => {
    const fixture = TestBed.createComponent(MoreMenu);
    const items: MoreMenuItem[] = [
      {icon: 'info-empty', label: 'Info'},
    ];
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
    fixture.detectChanges();

    const menuItem = fixture.nativeElement.querySelector('.more-menu__item');
    expect(menuItem.classList.contains('more-menu__item--expandable')).toBe(false);
  });

  it('should expand children on click of expandable item', async () => {
    const fixture = TestBed.createComponent(MoreMenu);
    const items: MoreMenuItem[] = [
      {
        icon: 'graph-up',
        label: 'Chart Types',
        children: [
          {icon: 'graph-up', label: 'Line', value: 'chart-type:line'},
          {icon: 'stats-up-square', label: 'Bar', value: 'chart-type:bar'},
        ],
      },
    ];
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
    fixture.detectChanges();

    // Children should not be visible initially
    let children = fixture.nativeElement.querySelectorAll('.more-menu__child');
    expect(children.length).toBe(0);

    // Click to expand
    const menuItem = fixture.nativeElement.querySelector('.more-menu__item');
    menuItem.click();
    await fixture.whenStable();
    fixture.detectChanges();

    // Children should now be visible
    children = fixture.nativeElement.querySelectorAll('.more-menu__child');
    expect(children.length).toBe(2);

    // Item should have expanded class
    const expandedItem = fixture.nativeElement.querySelector('.more-menu__item--expanded');
    expect(expandedItem).toBeTruthy();
  });

  it('should collapse children on second click', async () => {
    const fixture = TestBed.createComponent(MoreMenu);
    const items: MoreMenuItem[] = [
      {
        icon: 'graph-up',
        label: 'Chart Types',
        children: [{icon: 'graph-up', label: 'Line', value: 'chart-type:line'}],
      },
    ];
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
    fixture.detectChanges();

    const menuItem = fixture.nativeElement.querySelector('.more-menu__item');

    // First click: expand
    menuItem.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.more-menu__child').length).toBe(1);

    // Second click: collapse
    menuItem.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.more-menu__child').length).toBe(0);
  });

  it('should emit itemClicked when a non-expandable item is clicked', async () => {
    const fixture = TestBed.createComponent(MoreMenu);
    const items: MoreMenuItem[] = [
      {icon: 'info-empty', label: 'Info', value: 'info'},
    ];
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
    fixture.detectChanges();

    let emitted: MoreMenuItem | undefined;
    fixture.componentInstance.itemClicked.subscribe((item: MoreMenuItem) => emitted = item);

    const menuItem = fixture.nativeElement.querySelector('.more-menu__item');
    menuItem.click();

    expect(emitted).toBeDefined();
    expect(emitted!.value).toBe('info');
  });

  it('should emit itemClicked with child value when a child is clicked', async () => {
    const fixture = TestBed.createComponent(MoreMenu);
    const items: MoreMenuItem[] = [
      {
        icon: 'graph-up',
        label: 'Chart Types',
        children: [
          {icon: 'graph-up', label: 'Line', value: 'chart-type:line'},
          {icon: 'stats-up-square', label: 'Bar', value: 'chart-type:bar'},
        ],
      },
    ];
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
    fixture.detectChanges();

    let emitted: MoreMenuItem | undefined;
    fixture.componentInstance.itemClicked.subscribe((item: MoreMenuItem) => emitted = item);

    // First expand
    fixture.nativeElement.querySelector('.more-menu__item').click();
    await fixture.whenStable();
    fixture.detectChanges();

    // Click the second child (Bar)
    const children = fixture.nativeElement.querySelectorAll('.more-menu__child');
    children[1].click();
    await fixture.whenStable();

    expect(emitted).toBeDefined();
    expect(emitted!.value).toBe('chart-type:bar');
  });
});
