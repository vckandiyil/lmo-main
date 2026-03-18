import {Routes} from '@angular/router';
import {HomePage} from './pages/home/home';
import {LaborMarketInsightsPage} from './pages/labor-market-insights/labor-market-insights';
import {MyLmoPage} from './pages/my-lmo/my-lmo';
import {WhatIfPage} from './pages/what-if/what-if';
import {ForecastPage} from './pages/forecast/forecast';
import {GapAnalysisPage} from './pages/gap-analysis/gap-analysis';

export const routes: Routes = [
  {path: '', component: HomePage},
  {path: 'labor-market-insights', component: LaborMarketInsightsPage},
  {path: 'gap-analysis', component: GapAnalysisPage},
  {path: 'my-lmo', component: MyLmoPage},
  {path: 'what-if', component: WhatIfPage},
  {path: 'forecast', component: ForecastPage},
];
