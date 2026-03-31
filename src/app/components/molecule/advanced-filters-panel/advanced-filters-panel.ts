import {Component, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {Dropdown} from '../../atom/dropdown/dropdown';
import {Icon} from '../../atom/icon/icon';

@Component({
  selector: 'app-advanced-filters-panel',
  standalone: true,
  imports: [Dropdown, Icon, TranslateModule],
  templateUrl: './advanced-filters-panel.html',
  styleUrl: './advanced-filters-panel.scss'
})
export class AdvancedFiltersPanel {
  private readonly translate = inject(TranslateService);

  readonly isOpen = signal(false);

  readonly citizenshipOptions = toSignal(
    this.translate.stream(['LMI.ALL', 'LMI.EMIRATI', 'LMI.EXPAT']).pipe(
      map(t => [t['LMI.ALL'], t['LMI.EMIRATI'], t['LMI.EXPAT']])
    ),
    {initialValue: ['All', 'Emirati', 'Expat']}
  );

  readonly genderOptions = toSignal(
    this.translate.stream(['LMI.ALL', 'LMI.MALE', 'LMI.FEMALE']).pipe(
      map(t => [t['LMI.ALL'], t['LMI.MALE'], t['LMI.FEMALE']])
    ),
    {initialValue: ['All', 'Male', 'Female']}
  );

  readonly sectorOptions = toSignal(
    this.translate.stream(['LMI.ALL', 'LMI.EDUCATION', 'LMI.MEDICAL', 'LMI.IT', 'LMI.FINANCE', 'LMI.CONSTRUCTION', 'LMI.RETAIL', 'LMI.GOVERNMENT', 'LMI.OTHER']).pipe(
      map(t => [t['LMI.ALL'], t['LMI.EDUCATION'], t['LMI.MEDICAL'], t['LMI.IT'], t['LMI.FINANCE'], t['LMI.CONSTRUCTION'], t['LMI.RETAIL'], t['LMI.GOVERNMENT'], t['LMI.OTHER']])
    ),
    {initialValue: ['All', 'Education', 'Medical', 'IT', 'Finance', 'Construction', 'Retail', 'Government', 'Other']}
  );

  readonly yearOptions = toSignal(
    this.translate.stream(['LMI.ALL']).pipe(
      map(t => [t['LMI.ALL'], '2024', '2023', '2022', '2021', '2020'])
    ),
    {initialValue: ['All', '2024', '2023', '2022', '2021', '2020']}
  );

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  onFilterChange(_filter: string, _value: string): void {}
}
