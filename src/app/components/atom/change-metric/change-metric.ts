import {Component, computed, input} from '@angular/core';
import {Badge} from '../badge/badge';
import {Icon} from '../icon/icon';

@Component({
  selector: 'app-change-metric',
  standalone: true,
  imports: [Badge, Icon],
  templateUrl: './change-metric.html',
  styleUrl: './change-metric.scss',
})
export class ChangeMetric {
  readonly label = input.required<string>();
  readonly value = input.required<number>();

  protected readonly isPositive = computed(() => this.value() >= 0);
  protected readonly iconName = computed(() => this.isPositive() ? 'trending-up' : 'trending-down');
  protected readonly iconColor = computed(() => this.isPositive() ? '#5CC049' : '#EF4444');
  protected readonly badgeVariant = computed<'success' | 'danger'>(() => this.isPositive() ? 'success' : 'danger');
  protected readonly formattedValue = computed(() => {
    const v = this.value();
    return (v >= 0 ? '+' : '') + v + '%';
  });
}
