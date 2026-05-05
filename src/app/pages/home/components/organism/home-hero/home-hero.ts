import {Component, input} from '@angular/core';
import {Icon} from '../../../../../components/atom/icon/icon';
import {HeroBriefItem as HeroBriefItemCmp} from '../../molecule/hero-brief-item/hero-brief-item';
import {HeroSignalRow} from '../../molecule/hero-signal-row/hero-signal-row';
import {HeroKpiCard as HeroKpiCardCmp} from '../../molecule/hero-kpi-card/hero-kpi-card';
import type {HeroBriefItem, HeroKpiCard, HeroSignal} from './types';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [Icon, HeroBriefItemCmp, HeroSignalRow, HeroKpiCardCmp],
  templateUrl: './home-hero.html',
  styleUrl: './home-hero.scss',
})
export class HomeHero {
  readonly briefItems = input<HeroBriefItem[]>([]);
  readonly signals = input<HeroSignal[]>([]);
  readonly kpiCards = input<HeroKpiCard[]>([]);
  readonly liveLabel = input<string>('Live Data – Updated 13 min ago');
  readonly title = input<string>("Today's Labour Market Brief");
  readonly subtitle = input<string>('Your daily intelligence snapshot for smarter decisions.');
}
