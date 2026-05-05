import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-section-label',
  standalone: true,
  imports: [TranslateModule, Icon],
  templateUrl: './section-label.html',
  styleUrl: './section-label.scss',
})
export class SectionLabel {
  readonly text = input.required<string>();
  readonly helpIcon = input<boolean>(false);
}
