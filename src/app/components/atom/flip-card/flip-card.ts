import {Component, signal} from '@angular/core';

@Component({
  selector: 'app-flip-card',
  standalone: true,
  template: `
    <div class="flip-card__flipper" [class.flip-card__flipper--flipped]="flipped()">
      <div class="flip-card__face flip-card__face--front">
        <ng-content select="[front]"/>
      </div>
      <div class="flip-card__face flip-card__face--back">
        <ng-content select="[back]"/>
      </div>
    </div>
  `,
  styleUrl: './flip-card.scss',
})
export class FlipCard {
  flipped = signal(false);

  toggle(): void {
    this.flipped.update(v => !v);
  }
}
