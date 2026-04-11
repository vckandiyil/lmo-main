import {Component, computed, ElementRef, HostListener, inject, input, OnInit, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {RouterLink} from '@angular/router';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {Dropdown} from '../../atom/dropdown/dropdown';
import {Icon} from '../../atom/icon/icon';
import {SearchModal} from '../search-modal/search-modal';
import {PresentationModal} from '../../molecule/presentation-modal/presentation-modal';
import {ReportModal} from '../../molecule/report-modal/report-modal';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import {WidgetStore} from '../../../core';
import {FilterStateService} from '../../../core/services/filter-state.service';
import {LayoutService, LanguageService, ThemeService} from '../../../core';
import {PresetService} from '../../../core/services/preset.service';
import {AdvancedFiltersPanel} from '../../molecule/advanced-filters-panel/advanced-filters-panel';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [Dropdown, Icon, SearchModal, PresentationModal, ReportModal, TranslateModule, RouterLink, AdvancedFiltersPanel],
  templateUrl: './filters.html',
  styleUrl: './filters.scss'
})
export class Filters implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly widgetCatalogService = inject(WidgetCatalogService);
  private readonly widgetStore = inject(WidgetStore);
  private readonly filterState = inject(FilterStateService);
  private readonly translate = inject(TranslateService);
  private readonly layoutService = inject(LayoutService);
  private readonly languageService = inject(LanguageService);
  private readonly themeService = inject(ThemeService);
  readonly presetService = inject(PresetService);

  readonly isDarkMode = this.themeService.isDarkMode;

  readonly isRtl = this.languageService.isRtl;
  readonly layoutMode = this.layoutService.layoutMode;

  isMyLmo = input<boolean>(false);
  hideLayoutBtn = input<boolean>(false);
  isHome = input<boolean>(false);
  showAddWidget = input<boolean>(false);

  readonly activePresetName = this.presetService.activePresetName;

  readonly hasWidgets = computed(() =>
    this.widgetStore.leftWidgets().length > 0 || this.widgetStore.rightWidgets().length > 0
  );

  readonly showSaveAsPreset = computed(() =>
    this.hasWidgets() && !this.activePresetName()
  );

  isPresetDropdownOpen = signal(false);
  isCreatingPreset = signal(false);
  createMode = signal<'new' | 'save'>('new');
  newPresetName = signal('');

  confirmingDeleteName = signal<string | null>(null);
  renamingPresetName = signal<string | null>(null);
  renameInputValue = signal('');

  private readonly TOPIC_ORDER = ['Employment', 'Unemployment', 'Outside Labor Force', 'Job Vacancies', 'Job Seekers', 'Talent Pool'];

  readonly topicOptions = this.TOPIC_ORDER;
  selectedTopic = signal<string | null>(this.TOPIC_ORDER[0]);

  isSearchModalOpen = signal(false);
  isPresentationModalOpen = signal(false);
  isReportModalOpen = signal(false);
  isFilterPanelOpen = signal(false);
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
  ngOnInit(): void {
    if (!this.isMyLmo()) {
      this.onTopicSelect(this.TOPIC_ORDER[0]);
    }
  }

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

  onRegionMultiChange(_values: string[]) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isPresetDropdownOpen.set(false);
      if (this.isCreatingPreset()) {
        this.cancelCreatePreset();
      }
    }
  }

  togglePresetDropdown(): void {
    this.isPresetDropdownOpen.update(v => !v);
    if (!this.isPresetDropdownOpen()) {
      this.cancelCreatePreset();
    }
  }

  selectPreset(name: string): void {
    this.isPresetDropdownOpen.set(false);
    this.cancelCreatePreset();
    this.presetService.activePresetName.set(name);
    const preset = this.presetService.getPreset(name);
    if (preset) {
      this.widgetStore.setTopicLayout(preset.leftWidgets, preset.rightWidgets);
    }
  }

  askDeletePreset(name: string, event: MouseEvent): void {
    event.stopPropagation();
    this.renamingPresetName.set(null);
    this.confirmingDeleteName.set(name);
  }

  confirmDeletePreset(name: string, event: MouseEvent): void {
    event.stopPropagation();
    const wasActive = this.presetService.activePresetName() === name;
    this.presetService.deletePreset(name);
    this.confirmingDeleteName.set(null);
    if (wasActive) {
      this.widgetStore.setTopicLayout([], []);
    }
  }

  cancelDeletePreset(event: MouseEvent): void {
    event.stopPropagation();
    this.confirmingDeleteName.set(null);
  }

  startRenamePreset(name: string, event: MouseEvent): void {
    event.stopPropagation();
    this.confirmingDeleteName.set(null);
    this.renamingPresetName.set(name);
    this.renameInputValue.set(name);
  }

  confirmRenamePreset(event: Event): void {
    event.stopPropagation();
    const oldName = this.renamingPresetName();
    if (oldName) {
      this.presetService.renamePreset(oldName, this.renameInputValue());
    }
    this.renamingPresetName.set(null);
  }

  cancelRenamePreset(event: Event): void {
    event.stopPropagation();
    this.renamingPresetName.set(null);
  }

  startCreatePreset(mode: 'new' | 'save'): void {
    this.createMode.set(mode);
    this.isCreatingPreset.set(true);
    this.newPresetName.set('');
    this.isPresetDropdownOpen.set(false);
  }

  confirmCreatePreset(): void {
    const name = this.newPresetName().trim();
    if (!name) return;
    if (this.createMode() === 'save') {
      this.presetService.addPreset(name);
      this.presetService.updateActivePreset(
        this.widgetStore.leftWidgets().map(w => w.type),
        this.widgetStore.rightWidgets().map(w => w.type)
      );
    } else {
      this.presetService.addPreset(name);
      this.widgetStore.setTopicLayout([], []);
    }
    this.isCreatingPreset.set(false);
  }

  cancelCreatePreset(): void {
    this.isCreatingPreset.set(false);
    this.newPresetName.set('');
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

  openReportModal(): void {
    this.isReportModalOpen.set(true);
  }

  closeReportModal(): void {
    this.isReportModalOpen.set(false);
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

  openFilterPanel(): void {
    this.isFilterPanelOpen.set(true);
  }

  closeFilterPanel(): void {
    this.isFilterPanelOpen.set(false);
  }

  openMobileNav(): void {
    this.layoutService.openMobileNav();
  }

  // Triggered from the responsive filters panel — closes the panel and asks
  // the sidebar (via LayoutService) to open its widget picker.
  requestAddWidget(): void {
    this.closeFilterPanel();
    this.layoutService.requestAddWidget();
  }
}
