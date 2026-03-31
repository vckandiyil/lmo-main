import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection, NO_ERRORS_SCHEMA} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideRouter} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {GapAnalysisPage} from './gap-analysis';
import {LayoutService} from '../../core';
import {API_BASE_URL} from '../../core/tokens/api-base-url.token';

describe('GapAnalysisPage', () => {
  let layoutService: LayoutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GapAnalysisPage, TranslateModule.forRoot()],
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
    const fixture = TestBed.createComponent(GapAnalysisPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render gap-analysis-center in 3col mode', async () => {
    layoutService.setLayoutMode('3col');
    const fixture = TestBed.createComponent(GapAnalysisPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const center = fixture.nativeElement.querySelector('.gap-analysis-center');
    expect(center).toBeTruthy();
  });

  it('should not render gap-analysis-center in 4col mode', async () => {
    layoutService.setLayoutMode('4col');
    const fixture = TestBed.createComponent(GapAnalysisPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const center = fixture.nativeElement.querySelector('.gap-analysis-center');
    expect(center).toBeFalsy();
  });
});
