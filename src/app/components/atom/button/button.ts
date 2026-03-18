import { Component, input, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass, TranslateModule],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  readonly variant = input<'primary' | 'secondary' | 'outline' | 'outline-secondary' | 'dashed' | 'filled' | 'toolbar' | 'toolbar-icon' | 'filter-reset' | 'filter-apply' | 'toggle' | 'comment-add' | 'comment-cancel' | 'add-indicator'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input<boolean>(false);
  readonly active = input<boolean>(false);

  protected readonly buttonClasses = computed(() => {
    const classes: Record<string, boolean> = {
      button: true,
      [`button--${this.variant()}`]: true,
      'button--disabled': this.disabled(),
      'button--active': this.active(),
    };

    if (this.size() !== 'md') {
      classes[`button--${this.size()}`] = true;
    }

    return classes;
  });
}
