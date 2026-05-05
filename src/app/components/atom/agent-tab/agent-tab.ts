import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { StatusDot } from '../status-dot/status-dot';

@Component({
  selector: 'app-agent-tab',
  standalone: true,
  imports: [NgClass, TranslateModule, StatusDot],
  templateUrl: './agent-tab.html',
  styleUrl: './agent-tab.scss',
})
export class AgentTab {
  readonly status = input.required<'green' | 'red' | 'yellow'>();
  readonly label = input.required<string>();
  readonly selected = input<boolean>(false);

  protected readonly tabClasses = computed(() => ({
    'agent-tab': true,
    'agent-tab--selected': this.selected(),
  }));
}
