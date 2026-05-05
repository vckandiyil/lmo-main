import {Component, EventEmitter, Output, computed, input} from '@angular/core';
import {NgClass} from '@angular/common';
import {Icon} from '../../atom/icon/icon';

@Component({
  selector: 'app-feature-card',
  standalone: true,
  imports: [NgClass, Icon],
  templateUrl: './feature-card.html',
  styleUrl: './feature-card.scss',
})
export class FeatureCard {
  readonly variant = input<'ai' | 'platform'>('ai');
  readonly layout = input<'compact' | 'wide'>('compact');
  readonly iconName = input.required<string>();
  readonly tagline = input.required<string>();
  readonly title = input.required<string>();
  readonly intro = input<string>('');
  readonly bullets = input<string[]>([]);
  readonly ctaLabel = input<string>('Explore');

  @Output() readonly ctaClick = new EventEmitter<void>();

  protected readonly cardClasses = computed(() => ({
    'feature-card': true,
    'feature-card--ai': this.variant() === 'ai',
    'feature-card--platform': this.variant() === 'platform',
    'feature-card--wide': this.layout() === 'wide',
  }));

  protected onCtaClick(event: Event): void {
    event.preventDefault();
    this.ctaClick.emit();
  }
}
