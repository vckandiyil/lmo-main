import { Component, input, computed } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class Badge {
  readonly size = input<'md' | 'sm'>('md');
  readonly variant = input<'success' | 'danger' | 'impact'>('success');

  protected readonly badgeClasses = computed(() => ({
    badge: true,
    'badge--sm': this.size() === 'sm',
    'badge--danger': this.variant() === 'danger',
    'badge--impact': this.variant() === 'impact',
  }));
}
