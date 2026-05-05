import {Component, input} from '@angular/core';
import {Icon} from '../../../../../components/atom/icon/icon';

@Component({
  selector: 'app-hero-brief-item',
  standalone: true,
  imports: [Icon],
  templateUrl: './hero-brief-item.html',
  styleUrl: './hero-brief-item.scss',
})
export class HeroBriefItem {
  readonly icon = input.required<string>();
  readonly iconColor = input<string>('#5CC049');
  readonly iconBg = input<string>('#EEF7F4');
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly titleLink = input<boolean>(false);
  readonly hasDivider = input<boolean>(true);
}
