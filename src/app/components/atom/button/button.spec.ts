import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Button } from './button';

describe('Button', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Button],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Button);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should apply primary variant class by default', async () => {
    const fixture = TestBed.createComponent(Button);
    await fixture.whenStable();
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.classList.contains('button')).toBe(true);
    expect(buttonElement.classList.contains('button--primary')).toBe(true);
  });

  it('should apply secondary variant class', async () => {
    const fixture = TestBed.createComponent(Button);
    fixture.componentRef.setInput('variant', 'secondary');
    await fixture.whenStable();
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.classList.contains('button--secondary')).toBe(true);
  });

  it('should apply outline variant class', async () => {
    const fixture = TestBed.createComponent(Button);
    fixture.componentRef.setInput('variant', 'outline');
    await fixture.whenStable();
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.classList.contains('button--outline')).toBe(true);
  });

  it('should apply size modifier class for small', async () => {
    const fixture = TestBed.createComponent(Button);
    fixture.componentRef.setInput('size', 'sm');
    await fixture.whenStable();
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.classList.contains('button--sm')).toBe(true);
  });

  it('should apply size modifier class for large', async () => {
    const fixture = TestBed.createComponent(Button);
    fixture.componentRef.setInput('size', 'lg');
    await fixture.whenStable();
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.classList.contains('button--lg')).toBe(true);
  });

  it('should not apply size modifier for medium (default)', async () => {
    const fixture = TestBed.createComponent(Button);
    await fixture.whenStable();
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.classList.contains('button--md')).toBe(false);
  });

  it('should apply disabled state', async () => {
    const fixture = TestBed.createComponent(Button);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.classList.contains('button--disabled')).toBe(true);
    expect(buttonElement.disabled).toBe(true);
  });

  it('should render projected content in button__text element', async () => {
    const fixture = TestBed.createComponent(Button);
    await fixture.whenStable();
    fixture.detectChanges();
    const textElement = fixture.nativeElement.querySelector('.button__text');
    expect(textElement).toBeTruthy();
  });
});
