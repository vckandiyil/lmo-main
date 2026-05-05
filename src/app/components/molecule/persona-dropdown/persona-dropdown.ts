import {Component, ElementRef, HostListener, inject, input, output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {Icon} from '../../atom/icon/icon';

export interface PersonaGroup {
  key: string;
  label: string;
  options: { key: string; label: string }[];
}

@Component({
  selector: 'app-persona-dropdown',
  standalone: true,
  imports: [CommonModule, TranslateModule, Icon],
  templateUrl: './persona-dropdown.html',
  styleUrl: './persona-dropdown.scss',
})
export class PersonaDropdown {
  private readonly elementRef = inject(ElementRef);

  variant = input<'default' | 'panel'>('default');
  triggerLabel = input<string>('HOME.PERSONA');
  triggerValue = input<string>('HOME.POLICYMAKER');
  groups = input<PersonaGroup[]>([
    {
      key: 'lens',
      label: 'HOME.PERSONA_LENS',
      options: [
        {key: 'policymaker', label: 'HOME.POLICYMAKER'},
        {key: 'analyst', label: 'HOME.PERSONA_ANALYST'},
        {key: 'operator', label: 'HOME.PERSONA_OPERATOR'},
      ],
    },
    {
      key: 'interests',
      label: 'HOME.PERSONA_INTERESTS',
      options: [
        {key: 'workforce', label: 'HOME.PERSONA_WORKFORCE'},
        {key: 'emiratisation', label: 'HOME.PERSONA_EMIRATISATION'},
        {key: 'ai-skills', label: 'HOME.PERSONA_AI_SKILLS'},
        {key: 'finance', label: 'HOME.PERSONA_FINANCE'},
        {key: 'energy', label: 'HOME.PERSONA_ENERGY'},
        {key: 'healthcare', label: 'HOME.PERSONA_HEALTHCARE'},
      ],
    },
    {
      key: 'objective',
      label: 'HOME.PERSONA_OBJECTIVE',
      options: [
        {key: 'monitor', label: 'HOME.PERSONA_MONITOR'},
        {key: 'gaps', label: 'HOME.PERSONA_GAPS'},
      ],
    },
    {
      key: 'region',
      label: 'LMI.REGION',
      options: [
        {key: 'all', label: 'LMI.ALL'},
        {key: 'abu-dhabi', label: 'LMI.ABU_DHABI'},
        {key: 'al-ain', label: 'LMI.AL_AIN'},
        {key: 'al-dhafra', label: 'LMI.AL_DHAFRA'},
      ],
    },
    {
      key: 'horizon',
      label: 'HOME.PERSONA_HORIZON',
      options: [
        {key: 'daily', label: 'HOME.PERSONA_DAILY'},
        {key: 'weekly', label: 'HOME.PERSONA_WEEKLY'},
        {key: 'monthly', label: 'HOME.PERSONA_MONTHLY'},
        {key: '90-days', label: 'HOME.PERSONA_90_DAYS'},
        {key: '12-months', label: 'HOME.PERSONA_12_MONTHS'},
      ],
    },
  ]);

  applied = output<Record<string, string[]>>();

  readonly isOpen = signal(false);
  readonly selections = signal<Record<string, string[]>>({
    lens: ['policymaker'],
    interests: ['workforce', 'emiratisation'],
    objective: ['monitor', 'gaps'],
    region: ['abu-dhabi'],
    horizon: ['daily'],
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  apply(): void {
    this.applied.emit(this.selections());
    this.isOpen.set(false);
  }

  toggleChip(group: string, value: string): void {
    this.selections.update(map => {
      const current = map[group] ?? [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return {...map, [group]: next};
    });
  }

  isChipActive(group: string, value: string): boolean {
    return (this.selections()[group] ?? []).includes(value);
  }
}
