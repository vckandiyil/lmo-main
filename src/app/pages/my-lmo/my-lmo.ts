import {Component, computed, effect, inject, OnInit, ViewChild} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {Sidebar} from '../../components/organism/sidebar/sidebar';
import {Icon} from '../../components/atom/icon/icon';
import {Filters} from '../../components/organism/filters/filters';
import {LmiBar} from '../../components/organism/lmi-bar/lmi-bar';
import {CenterSection} from '../../components/organism/center-section/center-section';
import {LayoutService, WidgetStore} from '../../core';
import {PresetService} from '../../core/services/preset.service';

@Component({
  selector: 'app-my-lmo',
  standalone: true,
  imports: [Sidebar, Icon, Filters, LmiBar, CenterSection, TranslateModule],
  templateUrl: './my-lmo.html',
  styleUrl: './my-lmo.scss',
})
export class MyLmoPage implements OnInit {
  @ViewChild(Sidebar) private sidebarRef!: Sidebar;

  private readonly widgetStore = inject(WidgetStore);
  private readonly presetService = inject(PresetService);
  readonly layoutMode = inject(LayoutService).layoutMode;

  readonly hasWidgets = computed(() =>
    this.widgetStore.leftWidgets().length > 0 || this.widgetStore.rightWidgets().length > 0
  );

  constructor() {
    effect(() => {
      if (this.presetService.activePresetName()) {
        this.presetService.updateActivePreset(
          this.widgetStore.leftWidgets().map(w => w.type),
          this.widgetStore.rightWidgets().map(w => w.type)
        );
      }
    });
  }

  ngOnInit(): void {
    const activeName = this.presetService.activePresetName();
    if (activeName) {
      const preset = this.presetService.getPreset(activeName);
      if (preset) {
        this.widgetStore.setTopicLayout(preset.leftWidgets, preset.rightWidgets);
        return;
      }
    }
    this.widgetStore.setTopicLayout([], []);
  }

  openWidgetCenter(): void {
    this.sidebarRef.openWidgetCenterSplitEvenly();
  }
}
