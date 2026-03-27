import {Component, output} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {Icon} from '../../atom/icon/icon';
import {InlineSvg} from '../../atom/inline-svg/inline-svg';

@Component({
  selector: 'app-map-widget-card',
  standalone: true,
  imports: [TranslateModule, Icon, InlineSvg],
  templateUrl: './map-widget-card.html',
  styleUrl: './map-widget-card.scss',
})
export class MapWidgetCard {
  expandClick = output<void>();
}
