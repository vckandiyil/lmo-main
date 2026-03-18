import {Component, input} from '@angular/core';

@Component({
  selector: 'app-widget-checkbox',
  standalone: true,
  template: `
    <div class="widget-checkbox" [class.widget-checkbox--selected]="selected()">
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle class="widget-checkbox__circle" cx="8.5" cy="8.5" r="6.58" stroke-width="1.5"/>
        <path class="widget-checkbox__check" d="M5 8.5L7.5 11L12 6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `,
  styleUrl: './widget-checkbox.scss',
})
export class WidgetCheckbox {
  readonly selected = input(false);
}
