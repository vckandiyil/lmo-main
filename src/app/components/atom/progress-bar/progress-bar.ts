import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
})
export class ProgressBar {
  @Input() percentage: number = 0;
  @Input() fillColor: string = '#589FB7';
  @Input() backgroundColor: string = 'transparent';
  @Input() height: number = 8;
  @Input() borderRadius: number = 17;
}
