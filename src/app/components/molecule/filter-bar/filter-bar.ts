import {Component, computed, input, output, signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {Icon} from '../../atom/icon/icon';
import {Button} from '../../atom/button/button';
import {Dropdown} from '../../atom/dropdown/dropdown';

export interface FilterConfig {
  key: string;
  label: string;
  options: string[];
  type: 'radio' | 'checkbox';
}

export type FilterValues = Record<string, string | string[]>;

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [Icon, Button, Dropdown, TranslateModule],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
  host: {
    '[class.filter-bar--open]': 'isPanelOpen() || isPanelClosing()'
  }
})
export class FilterBar {
  readonly filters = input<FilterConfig[]>([]);
  readonly filtersApplied = output<FilterValues>();

  readonly isPanelOpen = signal(false);
  readonly isPanelClosing = signal(false);

  private readonly selectedValues = signal<FilterValues>({});
  private readonly appliedValues = signal<FilterValues>({});

  readonly displayValues = computed(() => {
    const applied = this.appliedValues();
    const result: Record<string, string | null> = {};
    for (const filter of this.filters()) {
      const val = applied[filter.key];
      if (!val || (Array.isArray(val) && val.length === 0)) {
        result[filter.key] = null;
      } else if (Array.isArray(val)) {
        result[filter.key] = val.length === 1 ? val[0] : `${val.length} selected`;
      } else {
        result[filter.key] = val as string;
      }
    }
    return result;
  });

  openPanel(): void {
    if (!this.isPanelOpen() && !this.isPanelClosing()) {
      this.isPanelOpen.set(true);
    }
  }

  togglePanel(): void {
    if (this.isPanelOpen()) {
      this.isPanelClosing.set(true);
      setTimeout(() => {
        this.isPanelClosing.set(false);
        this.isPanelOpen.set(false);
      }, 500);
    } else {
      this.isPanelOpen.set(true);
    }
  }

  isRadioChecked(key: string, option: string): boolean {
    return this.selectedValues()[key] === option;
  }

  isCheckboxChecked(key: string, option: string): boolean {
    const val = this.selectedValues()[key];
    return Array.isArray(val) && val.includes(option);
  }

  setRadio(key: string, option: string): void {
    this.selectedValues.update(v => ({...v, [key]: option}));
  }

  toggleCheckbox(key: string, option: string): void {
    this.selectedValues.update(current => {
      const val = current[key];
      const arr = Array.isArray(val) ? val : [];
      const updated = arr.includes(option) ? arr.filter(v => v !== option) : [...arr, option];
      return {...current, [key]: updated};
    });
  }

  resetFilters(): void {
    this.selectedValues.set({});
    this.appliedValues.set({});
  }

  applyFilters(): void {
    this.appliedValues.set({...this.selectedValues()});
    this.filtersApplied.emit({...this.selectedValues()});
    this.togglePanel();
  }
}
