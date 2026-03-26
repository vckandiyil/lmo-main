import {Component, computed, inject, QueryList, signal, ViewChildren} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {Dropdown} from '../../atom/dropdown/dropdown';
import {Icon} from '../../atom/icon/icon';
import {SearchModal} from '../search-modal/search-modal';
import {PresentationModal} from '../../molecule/presentation-modal/presentation-modal';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import {WidgetStore} from '../../../core';
import {FilterStateService} from '../../../core/services/filter-state.service';
import {LayoutService, LanguageService} from '../../../core';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [Dropdown, Icon, SearchModal, PresentationModal, TranslateModule],
  templateUrl: './filters.html',
  styleUrl: './filters.scss'
})
export class Filters {
  @ViewChildren(Dropdown) dropdowns!: QueryList<Dropdown>;

  private readonly widgetCatalogService = inject(WidgetCatalogService);
  private readonly widgetStore = inject(WidgetStore);
  private readonly filterState = inject(FilterStateService);
  private readonly translate = inject(TranslateService);
  private readonly layoutService = inject(LayoutService);
  private readonly languageService = inject(LanguageService);

  readonly isRtl = this.languageService.isRtl;

  readonly layoutMode = this.layoutService.layoutMode;

  private readonly TOPIC_ORDER = ['Employment', 'Unemployment', 'Outside Labor Force', 'Job Vacancies', 'Job Seekers'];

  private readonly topics = toSignal(this.widgetCatalogService.getTopics(), {initialValue: []});
  readonly topicOptions = computed(() => {
    return [...this.topics()].sort(
      (a, b) => (this.TOPIC_ORDER.indexOf(a) ?? Infinity) - (this.TOPIC_ORDER.indexOf(b) ?? Infinity)
    );
  });
  selectedTopic = signal<string | null>(null);

  isSearchModalOpen = signal(false);
  isPresentationModalOpen = signal(false);
  searchQuery = signal('');
  isMicSpeaking = signal(false);

  readonly regionOptions = toSignal(
    this.translate.stream(['LMI.ALL', 'LMI.ABU_DHABI', 'LMI.AL_AIN', 'LMI.AL_DHAFRA']).pipe(
      map(t => [t['LMI.ALL'], t['LMI.ABU_DHABI'], t['LMI.AL_AIN'], t['LMI.AL_DHAFRA']])
    ),
    {initialValue: ['All', 'Abu Dhabi', 'Al Ain', 'Al Dhafra']}
  );
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

  onTopicSelect(value: string): void {
    this.selectedTopic.set(value);
    this.filterState.selectedTopic.set(value);
    this.widgetCatalogService.getWidgetsByCategory(value).subscribe(widgets => {
      const mid = Math.ceil(widgets.length / 2);
      const leftTypes = widgets.slice(0, mid).map(w => w.id as any);
      const rightTypes = widgets.slice(mid).map(w => w.id as any);
      this.widgetStore.setTopicLayout(leftTypes, rightTypes);
    });
  }

  onFilterChange(_filter: string, _value: string) {}

  clearFilters() {
    this.dropdowns.forEach(dropdown => dropdown.reset());
    this.selectedTopic.set(null);
    this.filterState.selectedTopic.set(null);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  openPresentationModal(): void {
    this.isPresentationModalOpen.set(true);
  }

  closePresentationModal(): void {
    this.isPresentationModalOpen.set(false);
  }

  toggleMic(): void {
    this.isMicSpeaking.update(v => !v);
  }

  openSearchModal(): void {
    this.isSearchModalOpen.set(true);
  }

  closeSearchModal(): void {
    this.isSearchModalOpen.set(false);
  }

  toggleLayout(): void {
    this.layoutService.setLayoutMode(this.layoutMode() === '3col' ? '4col' : '3col');
  }
}
