import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable, shareReplay} from 'rxjs';
import {API_BASE_URL} from '../tokens/api-base-url.token';

export interface RegionMetric {
  label: string;
  value: number;
  unit: string;
  trend: {value: number; year?: string}[];
  isPositive: boolean;
}

export interface RegionProfileData {
  metrics: RegionMetric[];
}

export interface SplitData {
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
}

export interface LaborForceCompositionData {
  totalLaborForce: number;
  participationRate: number;
  nationalitySplit: SplitData;
  genderSplit: SplitData;
}

export interface EducationDataItem {
  label: string;
  emirati: number;
  expat: number;
}

export interface ImmigrationDataItem {
  label: string;
  value: number;
}

export interface MarketEntrantsData {
  educationData: EducationDataItem[];
  immigrationData: ImmigrationDataItem[];
}

export interface SectorData {
  name: string;
  vacancies: number;
  jobseekers: number;
  gap: number;
}

export interface SectorGapsOpportunitiesData {
  sectors: SectorData[];
}

export interface RateDataItem {
  year: string;
  rate: number;
}

export interface UnemploymentRateData {
  rateData: RateDataItem[];
}

export interface AgeGroupData {
  ageGroup: string;
  femaleExpat: number;
  maleExpat: number;
  maleEmirati: number;
  femaleEmirati: number;
  unemployed: number;
}

export interface WorkforceStructureData {
  ageGroups: AgeGroupData[];
}

export interface EmploymentRateData {
  rateData: RateDataItem[];
}

export interface TrendPoint {
  x: number;
  y: number;
}

export interface EmploymentRateTrendData {
  trendData: TrendPoint[];
  yAxisMin: number;
  yAxisMax: number;
  tickPositions: number[];
}

export interface EmploymentData {
  employmentData: number[];
  unemploymentData: number[];
  years: string[];
}

export interface MaritalStatusDataItem {
  label: string;
  value: number;
}

export interface MaritalActivityStatusData {
  statusData: MaritalStatusDataItem[];
}

export interface LabourMarketPolicyEntry {
  created_date: string;
  descriptions: string[];
  descriptions_ar?: string[];
}

export interface NewsItem {
  image: string;
  published_date: string;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  url: string;
}

export interface NewsData {
  items: NewsItem[];
  featured: NewsItem;
}

export interface DashboardData {
  regionProfile: RegionProfileData;
  laborForceComposition: LaborForceCompositionData;
  marketEntrants: MarketEntrantsData;
  sectorGapsOpportunities: SectorGapsOpportunitiesData;
  unemploymentRate: UnemploymentRateData;
  workforceStructure: WorkforceStructureData;
  employmentRate: EmploymentRateData;
  employmentRateTrend: EmploymentRateTrendData;
  employment: EmploymentData;
  maritalActivityStatus: MaritalActivityStatusData;
}

export interface IndicatorSecurity {
  label: string;
  name: string;
  description: string;
}

export interface IndicatorFilterOption {
  id: string;
  label: string;
  unit: string | null;
  value: number | null;
  isSelected?: boolean;
}

export interface IndicatorFilter {
  id: string;
  options: IndicatorFilterOption[];
}

export interface ChartDataPoint {
  VALUE: number;
  OBS_DT: string;
  YEAR: string;
}

export interface SeriesMeta {
  data: ChartDataPoint[];
  yMax: number;
  yMin: number;
  label?: string;
  color?: string;
}

export interface VisualizationMeta {
  id: string;
  type: string;
  seriesMeta: SeriesMeta[];
  yAxisLabel: string;
  relatedSV: RelatedSV[];
  hideChart: string[];
  indicatorFilters: IndicatorFilter[];
}

export interface RelatedSV {
  note: string;
  title: string;
  title_ar: string;
  id: string;
  content_type: string;
}

export interface MetaDataItem {
  label: string;
  value: string;
}

export interface ForecastDataPoint {
  YEAR: string;
  VALUE: number;
}

export interface RelatedSVDataPoint {
  YEAR: string;
  VALUE: number;
}

export interface RelatedSVEntry {
  title: string;
  data: RelatedSVDataPoint[];
}

export type RelatedSVMap = Record<string, RelatedSVEntry>;
export type ForecastRelatedSVMap = Record<string, ForecastDataPoint[]>;

export interface OverviewValueMeta {
  id: string;
  value: string;
  yearlyCompareValue: number;
  yearlyChangeValue: number;
  quarterlyCompareValue: number;
  quarterlyChangeValue: number;
  monthlyCompareValue: number;
  monthlyChangeValue: number;
}

export interface EmploymentRateDetailData {
  id: string;
  component_title: string;
  component_subtitle: string;
  type: string;
  updated: string;
  security: IndicatorSecurity;
  indicatorFilters: IndicatorFilter[];
  indicatorValues: {
    overviewValuesMeta: OverviewValueMeta[];
  };
  indicatorVisualizations: {
    visualizationsMeta: VisualizationMeta[];
  };
  metaData: MetaDataItem[];
  unit: string;
  data_source: string;
}


@Injectable({providedIn: 'root'})
export class DashboardDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private cache$: Observable<DashboardData> | null = null;
  private employmentRateDetailCache$: Observable<EmploymentRateDetailData> | null = null;
  private populationNumberDetailCache$: Observable<EmploymentRateDetailData> | null = null;
  private unemploymentDetailCache$: Observable<EmploymentRateDetailData> | null = null;
  private emiratisationDetailCache$: Observable<EmploymentRateDetailData> | null = null;
  private laborForceParticipationDetailCache$: Observable<EmploymentRateDetailData> | null = null;
  private vacancyRateDetailCache$: Observable<EmploymentRateDetailData> | null = null;
  private labourMarketPoliciesCache$: Observable<LabourMarketPolicyEntry[][]> | null = null;
  private newsCache$: Observable<NewsData> | null = null;

  /**
   * Get dashboard data with caching.
   * The data is fetched once and cached for all subsequent requests.
   * shareReplay(1) ensures:
   * - Only one HTTP request is made
   * - All subscribers receive the same cached data
   * - Late subscribers get the cached result immediately
   */
  getData(): Observable<DashboardData> {
    if (!this.cache$) {
      this.cache$ = this.http.get<DashboardData>(`${this.baseUrl}/dashboard.json`).pipe(
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  getEmploymentRateDetail(): Observable<EmploymentRateDetailData> {
    if (!this.employmentRateDetailCache$) {
      this.employmentRateDetailCache$ = this.http
        .get<any>(`${this.baseUrl}/employmentRate.json`)
        .pipe(
          map(raw => raw?.data?.visualizations ? this.mapV2ToLegacyDetail(raw) : raw as EmploymentRateDetailData),
          shareReplay(1),
        );
    }
    return this.employmentRateDetailCache$;
  }

  private mapV2ToLegacyDetail(raw: any): EmploymentRateDetailData {
    const d   = raw.data;
    const viz = d.visualizations?.[0];
    const totalSeries = (viz?.series ?? []).find((s: any) => s.group === 'total' && !s.isForecast);
    return {
      id:                   String(d.id ?? ''),
      component_title:      d.title ?? '',
      component_subtitle:   d.description ?? '',
      type:                 d.type ?? '',
      updated:              d.updated ?? '',
      unit:                 d.unit ?? '',
      data_source:          d.dataSource ?? '',
      security:             {label: d.classification ?? '', name: '', description: ''},
      indicatorFilters:     [],
      metaData:             d.metadata ?? [],
      indicatorValues:      {overviewValuesMeta: []},
      indicatorVisualizations: {
        visualizationsMeta: [{
          id:            '',
          type:          viz?.chartType ?? 'line',
          yAxisLabel:    '',
          relatedSV:     [],
          hideChart:     [],
          indicatorFilters: [],
          seriesMeta: [{
            label:  totalSeries?.label ?? '',
            color:  totalSeries?.color ?? '#A2C2FE',
            yMax:   totalSeries?.yMax  ?? 0,
            yMin:   totalSeries?.yMin  ?? 0,
            data:   (totalSeries?.data ?? []).map((p: any) => ({VALUE: p.VALUE, YEAR: p.YEAR})),
          }],
        }],
      },
    } as EmploymentRateDetailData;
  }

  getPopulationNumberDetail(): Observable<EmploymentRateDetailData> {
    if (!this.populationNumberDetailCache$) {
      this.populationNumberDetailCache$ = this.http
        .get<any>(`${this.baseUrl}/populationNumber.json`)
        .pipe(
          map(raw => this.mapV2ToLegacyDetail(raw)),
          shareReplay(1),
        );
    }
    return this.populationNumberDetailCache$;
  }

  getUnemploymentDetail(): Observable<EmploymentRateDetailData> {
    if (!this.unemploymentDetailCache$) {
      this.unemploymentDetailCache$ = this.http
        .get<any>(`${this.baseUrl}/unemploymentRate.json`)
        .pipe(
          map(raw => this.mapV2ToLegacyDetail(raw)),
          shareReplay(1),
        );
    }
    return this.unemploymentDetailCache$;
  }

  getEmiratisationDetail(): Observable<EmploymentRateDetailData> {
    if (!this.emiratisationDetailCache$) {
      this.emiratisationDetailCache$ = this.http
        .get<any>(`${this.baseUrl}/emiratisation.json`)
        .pipe(
          map(raw => this.mapV2ToLegacyDetail(raw)),
          shareReplay(1),
        );
    }
    return this.emiratisationDetailCache$;
  }

  getLaborForceParticipationDetail(): Observable<EmploymentRateDetailData> {
    if (!this.laborForceParticipationDetailCache$) {
      this.laborForceParticipationDetailCache$ = this.http
        .get<any>(`${this.baseUrl}/laborForceParticipation.json`)
        .pipe(
          map(raw => this.mapV2ToLegacyDetail(raw)),
          shareReplay(1),
        );
    }
    return this.laborForceParticipationDetailCache$;
  }

  getVacancyRateDetail(): Observable<EmploymentRateDetailData> {
    if (!this.vacancyRateDetailCache$) {
      this.vacancyRateDetailCache$ = this.http
        .get<any>(`${this.baseUrl}/vacancyRate.json`)
        .pipe(
          map(raw => this.mapV2ToLegacyDetail(raw)),
          shareReplay(1),
        );
    }
    return this.vacancyRateDetailCache$;
  }

  getLabourMarketPolicies(): Observable<LabourMarketPolicyEntry[][]> {
    if (!this.labourMarketPoliciesCache$) {
      this.labourMarketPoliciesCache$ = this.http.get<LabourMarketPolicyEntry[][]>(`${this.baseUrl}/labourMarketPolicies.json`).pipe(
        shareReplay(1)
      );
    }
    return this.labourMarketPoliciesCache$;
  }

  getNews(): Observable<NewsData> {
    if (!this.newsCache$) {
      this.newsCache$ = this.http.get<NewsData>(`${this.baseUrl}/news.json`).pipe(
        shareReplay(1)
      );
    }
    return this.newsCache$;
  }

}
