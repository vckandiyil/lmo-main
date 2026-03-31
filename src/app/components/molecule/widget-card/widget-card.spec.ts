import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {TranslateModule} from '@ngx-translate/core';
import {WidgetCard} from './widget-card';
import {API_BASE_URL} from '../../../core/tokens/api-base-url.token';
import type {MoreMenuItem} from '../../atom/more-menu/more-menu';

describe('WidgetCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetCard, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: API_BASE_URL, useValue: 'http://localhost'},
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(WidgetCard);
    fixture.componentRef.setInput('title', 'Test Widget');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should build moreItems with Chart Types when viewTypes are provided', () => {
    const fixture = TestBed.createComponent(WidgetCard);
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('viewTypes', [
      {id: 'line', label: 'Line Chart', icon: 'graph-up', default: true},
      {id: 'bar', label: 'Bar Chart', icon: 'stats-up-square'},
      {id: 'pie', label: 'Pie Chart', icon: 'chart-pie'},
      {id: 'table', label: 'Table', icon: 'layout-left'},
    ]);
    fixture.detectChanges();

    const moreItems: MoreMenuItem[] = fixture.componentInstance.moreItems();

    // Should have: Information, Chart Types (expandable), What If, Download
    expect(moreItems.length).toBe(4);

    const chartTypesItem = moreItems.find(item => item.label === 'HOME.MORE_CHART_TYPES');
    expect(chartTypesItem).toBeTruthy();
    expect(chartTypesItem!.children?.length).toBe(4);
    expect(chartTypesItem!.children![0].value).toBe('chart-type:line');
    expect(chartTypesItem!.children![1].value).toBe('chart-type:bar');
    expect(chartTypesItem!.children![2].value).toBe('chart-type:pie');
    expect(chartTypesItem!.children![3].value).toBe('chart-type:table');
  });

  it('should NOT include Chart Types menu item when viewTypes is empty', () => {
    const fixture = TestBed.createComponent(WidgetCard);
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('viewTypes', []);
    fixture.detectChanges();

    const moreItems: MoreMenuItem[] = fixture.componentInstance.moreItems();
    const chartTypesItem = moreItems.find(item => item.label === 'HOME.MORE_CHART_TYPES');
    expect(chartTypesItem).toBeUndefined();
    // Should have: Information, What If, Download
    expect(moreItems.length).toBe(3);
  });

  it('should use i18n keys for chart type labels', () => {
    const fixture = TestBed.createComponent(WidgetCard);
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('viewTypes', [
      {id: 'line', label: 'Line Chart', icon: 'graph-up'},
      {id: 'bar', label: 'Bar Chart', icon: 'stats-up-square'},
      {id: 'pie', label: 'Pie Chart', icon: 'chart-pie'},
    ]);
    fixture.detectChanges();

    const chartTypesItem = fixture.componentInstance.moreItems()
      .find(item => item.label === 'HOME.MORE_CHART_TYPES');

    expect(chartTypesItem!.children![0].label).toBe('HOME.CHART_TYPE_LINE');
    expect(chartTypesItem!.children![1].label).toBe('HOME.CHART_TYPE_BAR');
    expect(chartTypesItem!.children![2].label).toBe('HOME.CHART_TYPE_PIE');
  });

  it('should render chart-wrapper on front face when activeChartType is not table', async () => {
    const fixture = TestBed.createComponent(WidgetCard);
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('activeChartType', 'line');
    fixture.componentRef.setInput('chartOptions', {chart: {type: 'line'}});
    await fixture.whenStable();
    fixture.detectChanges();

    const frontFace = fixture.nativeElement.querySelector('.flip-card__face--front');
    expect(frontFace).toBeTruthy();

    const chartWrapper = frontFace.querySelector('app-chart-wrapper');
    expect(chartWrapper).toBeTruthy();

    const table = frontFace.querySelector('.widget-card__table');
    expect(table).toBeFalsy();
  });

  it('should render table on front face when activeChartType is "table"', async () => {
    const fixture = TestBed.createComponent(WidgetCard);
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('activeChartType', 'table');
    fixture.componentRef.setInput('tableRows', [
      {year: '2021', value: 100},
      {year: '2022', value: 200},
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const frontFace = fixture.nativeElement.querySelector('.flip-card__face--front');
    const chartWrapper = frontFace.querySelector('app-chart-wrapper');
    expect(chartWrapper).toBeFalsy();

    const tableRows = frontFace.querySelectorAll('.widget-card__table-row');
    expect(tableRows.length).toBe(2);
  });

  it('should display year and value in table rows', async () => {
    const fixture = TestBed.createComponent(WidgetCard);
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('activeChartType', 'table');
    fixture.componentRef.setInput('unit', '%');
    fixture.componentRef.setInput('tableRows', [{year: '2024', value: 42}]);
    await fixture.whenStable();
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('.widget-card__table-row');
    expect(row.textContent).toContain('2024');
    expect(row.textContent).toContain('42');
    expect(row.textContent).toContain('%');
  });
});
