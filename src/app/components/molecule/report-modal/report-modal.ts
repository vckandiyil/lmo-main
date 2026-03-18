import {Component, ElementRef, inject, input, output, QueryList, signal, ViewChildren} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {Dropdown} from '../../atom/dropdown/dropdown';
import {Button} from '../../atom/button/button';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [Dropdown, Button, TranslateModule],
  templateUrl: './report-modal.html',
  styleUrl: './report-modal.scss'
})
export class ReportModal {
  @ViewChildren(Dropdown, {read: ElementRef}) dropdownRefs!: QueryList<ElementRef>;
  @ViewChildren(Dropdown) dropdowns!: QueryList<Dropdown>;

  private readonly translate = inject(TranslateService);

  readonly isOpen = input<boolean>(false);
  readonly closed = output<void>();

  readonly isClosing = signal(false);

  readonly regionOptions = toSignal(
    this.translate.stream(['LMI.ALL', 'LMI.ABU_DHABI', 'LMI.AL_AIN', 'LMI.AL_DHAFRA']).pipe(
      map(t => [t['LMI.ALL'], t['LMI.ABU_DHABI'], t['LMI.AL_AIN'], t['LMI.AL_DHAFRA']])
    ),
    {initialValue: ['All', 'Abu Dhabi', 'Al Ain', 'Al Dhafra']}
  );
  readonly sectorOptions = toSignal(
    this.translate.stream(['LMI.ALL', 'LMI.EDUCATION', 'LMI.MEDICAL', 'LMI.IT', 'LMI.FINANCE', 'LMI.CONSTRUCTION', 'LMI.RETAIL', 'LMI.GOVERNMENT', 'LMI.OTHER']).pipe(
      map(t => [t['LMI.ALL'], t['LMI.EDUCATION'], t['LMI.MEDICAL'], t['LMI.IT'], t['LMI.FINANCE'], t['LMI.CONSTRUCTION'], t['LMI.RETAIL'], t['LMI.GOVERNMENT'], t['LMI.OTHER']])
    ),
    {initialValue: ['All', 'Education', 'Medical', 'IT', 'Finance', 'Construction', 'Retail', 'Government', 'Other']}
  );
  readonly timeRangeOptions = toSignal(
    this.translate.stream(['LMI.ALL']).pipe(
      map(t => [t['LMI.ALL'], '2024', '2023', '2022', '2021', '2020'])
    ),
    {initialValue: ['All', '2024', '2023', '2022', '2021', '2020']}
  );

  onBackdropClick(): void {
    this.close();
  }

  onContentClick(event: Event): void {
    event.stopPropagation();
    this.handleDropdownClose(event.target as Node);
  }

  close(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      this.isClosing.set(false);
      this.closed.emit();
    }, 300);
  }

  private handleDropdownClose(target: Node): void {
    const clickedDropdownIndex = this.dropdownRefs?.toArray().findIndex(
      ref => ref.nativeElement.contains(target)
    );

    this.dropdowns?.forEach((dropdown, index) => {
      if (index !== clickedDropdownIndex && dropdown.isOpen()) {
        dropdown.isOpen.set(false);
      }
    });
  }
}
