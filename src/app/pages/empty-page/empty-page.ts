import {Component} from '@angular/core';
import {Filters} from '../../components/organism/filters/filters';

@Component({
  selector: 'app-empty-page',
  standalone: true,
  imports: [Filters],
  template: '<app-filters></app-filters>',
})
export class EmptyPage {}
