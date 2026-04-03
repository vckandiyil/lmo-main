import {Injectable, signal, computed, effect} from '@angular/core';
import {WidgetType} from '../models/widget.model';

export interface Preset {
  name: string;
  leftWidgets: WidgetType[];
  rightWidgets: WidgetType[];
}

const STORAGE_KEY = 'lmo_presets';
const ACTIVE_KEY = 'lmo_active_preset';

@Injectable({providedIn: 'root'})
export class PresetService {
  readonly presets = signal<Preset[]>(this.loadFromStorage());
  readonly activePresetName = signal<string | null>(localStorage.getItem(ACTIVE_KEY));
  readonly presetNames = computed(() => this.presets().map(p => p.name));

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets()));
    });
    effect(() => {
      const name = this.activePresetName();
      if (name) {
        localStorage.setItem(ACTIVE_KEY, name);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
    });
  }

  addPreset(name: string): void {
    if (!this.presets().find(p => p.name === name)) {
      this.presets.update(ps => [...ps, {name, leftWidgets: [], rightWidgets: []}]);
    }
    this.activePresetName.set(name);
  }

  getPreset(name: string): Preset | undefined {
    return this.presets().find(p => p.name === name);
  }

  updateActivePreset(leftWidgets: WidgetType[], rightWidgets: WidgetType[]): void {
    const name = this.activePresetName();
    if (!name) return;
    this.presets.update(ps => ps.map(p => p.name === name ? {...p, leftWidgets, rightWidgets} : p));
  }

  addWidgetToPreset(presetName: string, widgetType: WidgetType): void {
    this.presets.update(ps => ps.map(p => {
      if (p.name !== presetName) return p;
      if (p.leftWidgets.includes(widgetType) || p.rightWidgets.includes(widgetType)) return p;
      return {...p, leftWidgets: [...p.leftWidgets, widgetType]};
    }));
  }

  renamePreset(oldName: string, newName: string): void {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    if (this.presets().find(p => p.name === trimmed)) return;
    this.presets.update(ps => ps.map(p => p.name === oldName ? {...p, name: trimmed} : p));
    if (this.activePresetName() === oldName) {
      this.activePresetName.set(trimmed);
    }
  }

  deletePreset(name: string): void {
    this.presets.update(ps => ps.filter(p => p.name !== name));
    if (this.activePresetName() === name) {
      this.activePresetName.set(null);
    }
  }

  private loadFromStorage(): Preset[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
