import { Component, signal } from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.scss'
})
export class Recommendations {
  activeStakeholder = signal<'policymakers' | 'employers' | 'jobseekers'>('policymakers');
  isExpanded = signal(false);

  setActiveStakeholder(stakeholder: 'policymakers' | 'employers' | 'jobseekers'): void {
    this.activeStakeholder.set(stakeholder);
  }

  toggle(): void {
    this.isExpanded.update(v => !v);
  }
}
