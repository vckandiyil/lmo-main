import {TestBed} from '@angular/core/testing';
import {Component} from '@angular/core';
import {provideZonelessChangeDetection} from '@angular/core';
import {FlipCard} from './flip-card';

@Component({
  standalone: true,
  imports: [FlipCard],
  template: `
    <app-flip-card #flipCard>
      <div front class="test-front">Front Content</div>
      <div back class="test-back">Back Content</div>
    </app-flip-card>
  `,
})
class TestHost {}

describe('FlipCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(FlipCard);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render front face content', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    fixture.detectChanges();

    const frontFace = fixture.nativeElement.querySelector('.flip-card__face--front');
    expect(frontFace).toBeTruthy();
    expect(frontFace.textContent).toContain('Front Content');
  });

  it('should render back face content', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    fixture.detectChanges();

    const backFace = fixture.nativeElement.querySelector('.flip-card__face--back');
    expect(backFace).toBeTruthy();
    expect(backFace.textContent).toContain('Back Content');
  });

  it('should not be flipped initially', async () => {
    const fixture = TestBed.createComponent(FlipCard);
    await fixture.whenStable();
    fixture.detectChanges();

    const flipper = fixture.nativeElement.querySelector('.flip-card__flipper');
    expect(flipper.classList.contains('flip-card__flipper--flipped')).toBe(false);
  });

  it('should toggle flipped state', async () => {
    const fixture = TestBed.createComponent(FlipCard);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.toggle();
    await fixture.whenStable();
    fixture.detectChanges();

    const flipper = fixture.nativeElement.querySelector('.flip-card__flipper');
    expect(flipper.classList.contains('flip-card__flipper--flipped')).toBe(true);
  });

  it('should toggle back to unflipped on double toggle', async () => {
    const fixture = TestBed.createComponent(FlipCard);
    await fixture.whenStable();

    fixture.componentInstance.toggle();
    fixture.componentInstance.toggle();
    await fixture.whenStable();
    fixture.detectChanges();

    const flipper = fixture.nativeElement.querySelector('.flip-card__flipper');
    expect(flipper.classList.contains('flip-card__flipper--flipped')).toBe(false);
  });
});
