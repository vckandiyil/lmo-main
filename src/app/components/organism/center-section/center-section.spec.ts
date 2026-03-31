import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection, NO_ERRORS_SCHEMA} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {TranslateModule} from '@ngx-translate/core';
import {CenterSection} from './center-section';
import {API_BASE_URL} from '../../../core/tokens/api-base-url.token';

describe('CenterSection', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CenterSection, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: API_BASE_URL, useValue: 'http://localhost'},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(CenterSection);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the center-section container', async () => {
    const fixture = TestBed.createComponent(CenterSection);
    fixture.detectChanges();
    await fixture.whenStable();

    const section = fixture.nativeElement.querySelector('.center-section');
    expect(section).toBeTruthy();
  });

  it('should render map container', async () => {
    const fixture = TestBed.createComponent(CenterSection);
    fixture.detectChanges();
    await fixture.whenStable();

    const map = fixture.nativeElement.querySelector('.center-section__map');
    expect(map).toBeTruthy();
  });

  it('should render zoom controls', async () => {
    const fixture = TestBed.createComponent(CenterSection);
    fixture.detectChanges();
    await fixture.whenStable();

    const controls = fixture.nativeElement.querySelector('.center-section__controls');
    expect(controls).toBeTruthy();
  });
});
