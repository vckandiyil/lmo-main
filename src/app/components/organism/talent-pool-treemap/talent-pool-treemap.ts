import {Component, computed, inject, input, OnInit, output, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {toSignal} from '@angular/core/rxjs-interop';
import {ChartWrapper} from '../../molecule/chart-wrapper/chart-wrapper';
import {WidgetHeader} from '../../atom/widget-header/widget-header';
import {WidgetCheckbox} from '../../atom/widget-checkbox/widget-checkbox';
import {FlipCard} from '../../atom/flip-card/flip-card';
import {WidgetBack} from '../../atom/widget-back/widget-back';
import {API_BASE_URL} from '../../../core/tokens/api-base-url.token';
import {WidgetCatalogService} from '../../../core/services/widget-catalog.service';
import {ThemeService} from '../../../core/services/theme.service';
import type {ChartOptions} from '../../../shared/services/chart-config.service';

@Component({
  selector: 'app-talent-pool-treemap',
  standalone: true,
  imports: [ChartWrapper, WidgetHeader, WidgetCheckbox, FlipCard, WidgetBack],
  templateUrl: './talent-pool-treemap.html',
  styleUrl: './talent-pool-treemap.scss',
})
export class TalentPoolTreemap implements OnInit {
  widgetType = input<string>('talent-pool-treemap');
  selected   = input(false);
  isCenter   = input(false);

  selectedChange = output<void>();
  expandClick    = output<void>();
  removeClick    = output<void>();

  private readonly http         = inject(HttpClient);
  private readonly baseUrl      = inject(API_BASE_URL);
  private readonly themeService = inject(ThemeService);
  private readonly catalogEntry = toSignal(
    inject(WidgetCatalogService).getWidgetById('talent-pool-treemap'),
    {initialValue: undefined}
  );

  readonly title = computed(() => this.catalogEntry()?.title ?? 'Talent Pool');

  private readonly treemapData    = signal<any[]>([]);
  private readonly emiratiTotal   = signal(0);
  private readonly nonEmiratiTotal = signal(0);

  readonly treemapChartOptions = computed<ChartOptions>(() => {
    const data   = this.treemapData();
    const isDark = this.themeService.isDarkMode();
    if (!data.length) return {};
    return this.buildTreemapOptions(data, isDark);
  });

  readonly miniChartOptions = computed<ChartOptions>(() => {
    const emirati    = this.emiratiTotal();
    const nonEmirati = this.nonEmiratiTotal();
    if (!emirati && !nonEmirati) return {};
    return this.buildMiniOptions(emirati, nonEmirati);
  });

  ngOnInit(): void {
    this.http.get<any>(`${this.baseUrl}/talentPoolTreemap.json`).subscribe(raw => {
      const data: any[] = raw?.data?.visualizations?.[0]?.series?.[0]?.data ?? [];

      const leaves         = data.filter((p: any) => p.value != null);
      const emiratiLeaves  = leaves.filter((p: any) => (p.parent as string)?.startsWith('Emirati-'));
      const nonEmiratiLeaves = leaves.filter((p: any) => (p.parent as string)?.startsWith('NonEmirati-'));

      this.emiratiTotal.set(emiratiLeaves.reduce((s: number, p: any) => s + (p.value ?? 0), 0));
      this.nonEmiratiTotal.set(nonEmiratiLeaves.reduce((s: number, p: any) => s + (p.value ?? 0), 0));
      this.treemapData.set(data);
    });
  }

  private buildTreemapOptions(data: any[], isDark: boolean): ChartOptions {
    const textColor       = isDark ? '#D1D5DB' : '#364151';
    const breadcrumbHover = isDark ? '#374151' : '#E5E7EB';

    return {
      chart: {
        backgroundColor: 'transparent',
        height: null as any,
      },
      title:    {text: ''},
      subtitle: {text: ''},
      series: [{
        type: 'treemap' as any,
        name: 'Employees',
        layoutAlgorithm: 'squarified',
        allowDrillToNode: true,
        animationLimit: 1000,
        borderColor: isDark ? '#252931' : '#ffffff',
        nodeSizeBy: 'leaf',
        dataLabels: {
          enabled: false,
          allowOverlap: true,
          style: {fontSize: '0.9em', textOutline: 'none'},
        },
        levels: [
          {
            level: 1,
            dataLabels: {
              enabled: true,
              align: 'left',
              style: {fontWeight: 'bold', fontSize: '0.8em', textTransform: 'uppercase', color: 'white'},
              padding: 4,
            },
            borderWidth: 3,
            levelIsConstant: false,
          },
          {
            level: 2,
            dataLabels: {
              enabled: true,
              align: 'center',
              style: {color: 'white', fontWeight: 'normal', fontSize: '0.65em', textOutline: 'none', textTransform: 'uppercase'},
            },
            borderWidth: 1,
            groupPadding: 2,
          },
          {
            level: 3,
            dataLabels: {
              enabled: true,
              align: 'center',
              format: '{point.name}<br/><span style="font-size:0.7em">{point.value:,.0f}</span>',
              style: {color: 'white', textOutline: 'none'},
            },
          },
        ],
        accessibility: {exposeAsGroupOnly: true},
        breadcrumbs: {
          buttonTheme: {
            style: {color: textColor},
            states: {
              hover: {fill: breadcrumbHover},
              select: {style: {color: textColor}},
            },
          },
        },
        tooltip: {
          followPointer: true,
          outside: true,
          headerFormat: '<span style="font-size: 0.9em">{point.custom.fullName}</span><br/>',
          pointFormat: '<b>Employees:</b> {point.value:,.0f}<br/>{#if point.custom.share}<b>Share:</b> {point.custom.share}%{/if}',
        } as any,
        data,
      }] as any,
      colorAxis: {
        minColor: '#2b6cb0',
        maxColor: '#38b2ac',
        stops: [[0, '#1e3a5f'], [0.5, '#2b6cb0'], [1, '#38b2ac']] as any,
        min: 5,
        max: 45,
        labels: {style: {color: textColor}, format: '{value}%'},
      } as any,
      legend: {itemStyle: {color: textColor}},
      credits: {enabled: false},
      accessibility: {enabled: false},
    };
  }

  private buildMiniOptions(emirati: number, nonEmirati: number): ChartOptions {
    const labelStyle = `color: var(--lmo-text-category); font-family: sans-serif; font-weight: 400; font-size: 11px;`;
    return {
      chart: {type: 'bar', height: 112, backgroundColor: 'transparent', spacing: [8, 12, 8, 0], marginLeft: 80},
      title: {text: ''},
      xAxis: {
        categories: ['Emirati', 'Non-Emirati'],
        labels: {
          enabled: true,
          useHTML: true,
          formatter: function(this: any) { return `<span style="${labelStyle}">${this.value}</span>`; },
        },
        lineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        title: {text: ''},
        labels: {enabled: false},
        gridLineWidth: 0,
      },
      legend: {enabled: false},
      tooltip: {enabled: false},
      credits: {enabled: false},
      plotOptions: {
        bar: {
          borderRadius: 3,
          dataLabels: {
            enabled: true,
            useHTML: true,
            formatter: function(this: any) {
              const v = this.y as number;
              const formatted = v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : v >= 1_000
                ? `${(v / 1_000).toFixed(0)}K`
                : String(v);
              return `<span style="font-family: sans-serif; font-size: 11px; font-weight: 500; color: #3375C6;">${formatted}</span>`;
            },
          },
        },
      },
      series: [{
        type: 'bar' as const,
        color: '#3375C6',
        data: [emirati, nonEmirati],
      }],
    };
  }
}
