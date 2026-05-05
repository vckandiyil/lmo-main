import {Component, computed, input} from '@angular/core';
import {Icon} from '../../../../../components/atom/icon/icon';
import {Badge} from '../../../../../components/atom/badge/badge';

@Component({
  selector: 'app-hero-kpi-card',
  standalone: true,
  imports: [Icon, Badge],
  templateUrl: './hero-kpi-card.html',
  styleUrl: './hero-kpi-card.scss',
})
export class HeroKpiCard {
  readonly icon = input.required<string>();
  readonly delta = input.required<string>();
  readonly trend = input<'up' | 'down'>('up');
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly previous = input.required<string>();

  protected readonly isUp = computed(() => this.trend() === 'up');
}
