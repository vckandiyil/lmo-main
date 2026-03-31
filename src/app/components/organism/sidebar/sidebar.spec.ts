import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection, NO_ERRORS_SCHEMA} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {TranslateModule} from '@ngx-translate/core';
import {Sidebar} from './sidebar';
import {LayoutService} from '../../../core';
import {API_BASE_URL} from '../../../core/tokens/api-base-url.token';

describe('Sidebar', () => {
  let layoutService: LayoutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: API_BASE_URL, useValue: 'http://localhost'},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    layoutService = TestBed.inject(LayoutService);
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render left and right sidebars in 3col mode', async () => {
    layoutService.setLayoutMode('3col');
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    await fixture.whenStable();

    const leftSidebar = fixture.nativeElement.querySelector('.sidebar--left');
    const rightSidebar = fixture.nativeElement.querySelector('.sidebar--right');
    expect(leftSidebar).toBeTruthy();
    expect(rightSidebar).toBeTruthy();
  });

  it('should render 4 column containers in 4col mode', async () => {
    layoutService.setLayoutMode('4col');
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    await fixture.whenStable();

    const col1 = fixture.nativeElement.querySelector('.sidebar--4col-1');
    const col2 = fixture.nativeElement.querySelector('.sidebar--4col-2');
    const col3 = fixture.nativeElement.querySelector('.sidebar--4col-3');
    const col4 = fixture.nativeElement.querySelector('.sidebar--4col-4');
    expect(col1).toBeTruthy();
    expect(col2).toBeTruthy();
    expect(col3).toBeTruthy();
    expect(col4).toBeTruthy();
  });

  it('should not render 4col containers in 3col mode', async () => {
    layoutService.setLayoutMode('3col');
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    await fixture.whenStable();

    const col4 = fixture.nativeElement.querySelector('.sidebar--4col-1');
    expect(col4).toBeFalsy();
  });

  it('should not render left/right sidebars in 4col mode', async () => {
    layoutService.setLayoutMode('4col');
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    await fixture.whenStable();

    const leftSidebar = fixture.nativeElement.querySelector('.sidebar--left');
    const rightSidebar = fixture.nativeElement.querySelector('.sidebar--right');
    expect(leftSidebar).toBeFalsy();
    expect(rightSidebar).toBeFalsy();
  });
});
