import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-dot',
  standalone: true,
  imports: [NgClass],
  templateUrl: './status-dot.html',
  styleUrl: './status-dot.scss',
})
export class StatusDot {
  readonly color = input<'green' | 'red' | 'yellow'>('green');
  readonly size = input<number>(8);

  protected readonly dotClasses = computed(() => ({
    'status-dot': true,
    [`status-dot--${this.color()}`]: true,
  }));

  protected readonly sizePx = computed(() => `${this.size()}px`);
}
