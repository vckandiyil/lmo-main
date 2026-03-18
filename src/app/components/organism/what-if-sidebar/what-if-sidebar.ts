import {Component, inject} from '@angular/core';
import {RangeSelector, RangeOption} from '../../atom/range-selector/range-selector';
import {WhatIfSimulationService, WhatIfSimDriver} from '../../../core/services/what-if-simulation.service';

interface DriverConfig {
  label: string;
  baseValue: number;
  driver: WhatIfSimDriver;
}

@Component({
  selector: 'app-what-if-sidebar',
  standalone: true,
  imports: [RangeSelector],
  templateUrl: './what-if-sidebar.html',
  styleUrl: './what-if-sidebar.scss',
})
export class WhatIfSidebar {
  private readonly sim = inject(WhatIfSimulationService);

  readonly rangeOptions: RangeOption[] = [
    {id: '-15', label: '-15%', value: -15},
    {id: '-10', label: '-10%', value: -10},
    {id: '-5', label: '-5%', value: -5},
    {id: '0', label: '0%', value: 0},
    {id: '5', label: '+5%', value: 5},
    {id: '10', label: '+10%', value: 10},
    {id: '15', label: '+15%', value: 15},
  ];

  readonly driverConfigs: DriverConfig[] = [
    {label: 'Labor Force Participation', baseValue: 50, driver: this.sim.drivers[0]},
    {label: 'Economic Growth', baseValue: 50, driver: this.sim.drivers[1]},
    {label: 'Sector Employment Growth', baseValue: 65, driver: this.sim.drivers[2]},
    {label: 'Emiratization Adjustment', baseValue: 40, driver: this.sim.drivers[3]},
    {label: 'Private Sector Incentives', baseValue: 65, driver: this.sim.drivers[4]},
  ];

  getAdjustedValue(cfg: DriverConfig): string | null {
    const offset = cfg.driver.value();
    if (offset === 0) return null;
    return `${cfg.baseValue + offset}%`;
  }

  isIncrease(cfg: DriverConfig): boolean {
    return cfg.driver.value() > 0;
  }

  onSliderChange(cfg: DriverConfig, value: string): void {
    cfg.driver.value.set(parseInt(value));
  }
}
