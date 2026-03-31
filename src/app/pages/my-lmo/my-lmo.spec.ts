import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection, NO_ERRORS_SCHEMA} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideRouter} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {MyLmoPage} from './my-lmo';
import {LayoutService, WidgetStore, WidgetType} from '../../core';
import {API_BASE_URL} from '../../core/tokens/api-base-url.token';

describe('MyLmoPage', () => {
  let layoutService: LayoutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyLmoPage, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {provide: API_BASE_URL, useValue: 'http://localhost'},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    layoutService = TestBed.inject(LayoutService);
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MyLmoPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show empty state when no widgets exist', async () => {
    const fixture = TestBed.createComponent(MyLmoPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const emptyState = fixture.nativeElement.querySelector('.my-lmo__empty');
    expect(emptyState).toBeTruthy();
  });

  it('should expose hasWidgets as true when widgets exist', async () => {
    const fixture = TestBed.createComponent(MyLmoPage);
    fixture.detectChanges();
    await fixture.whenStable();

    // Initially no widgets
    expect(fixture.componentInstance.hasWidgets()).toBe(false);

    // Add widgets after ngOnInit via the store's setTopicLayout
    const widgetStore = TestBed.inject(WidgetStore);
    widgetStore.setTopicLayout([WidgetType.Map], []);

    expect(fixture.componentInstance.hasWidgets()).toBe(true);
  });
});
