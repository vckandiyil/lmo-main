import {Routes} from '@angular/router';

export const routes: Routes = [
  {path: '', loadComponent: () => import('./pages/home/home').then(m => m.HomePage)},
  {path: 'labor-market-insights', loadComponent: () => import('./pages/labor-market-insights/labor-market-insights').then(m => m.LaborMarketInsightsPage)},
  {path: 'gap-analysis', loadComponent: () => import('./pages/gap-analysis/gap-analysis').then(m => m.GapAnalysisPage)},
  {path: 'gap-analysis/subpage-1', loadComponent: () => import('./pages/empty-page/empty-page').then(m => m.EmptyPage)},
  {path: 'gap-analysis/subpage-2', loadComponent: () => import('./pages/empty-page/empty-page').then(m => m.EmptyPage)},
  {path: 'job-market-intelligence', loadComponent: () => import('./pages/empty-page/empty-page').then(m => m.EmptyPage)},
  {path: 'job-market-intelligence/subpage-1', loadComponent: () => import('./pages/empty-page/empty-page').then(m => m.EmptyPage)},
  {path: 'job-market-intelligence/subpage-2', loadComponent: () => import('./pages/empty-page/empty-page').then(m => m.EmptyPage)},
  {path: 'my-lmo', loadComponent: () => import('./pages/my-lmo/my-lmo').then(m => m.MyLmoPage)},
  {path: 'what-if', loadComponent: () => import('./pages/what-if/what-if').then(m => m.WhatIfPage)},
  {path: 'forecast', loadComponent: () => import('./pages/forecast/forecast').then(m => m.ForecastPage)},
  {path: 'platform-features', loadComponent: () => import('./pages/platform-features/platform-features').then(m => m.PlatformFeaturesPage)},
];
