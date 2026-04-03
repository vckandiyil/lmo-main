import { Injectable } from '@angular/core';
import * as Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import 'highcharts/modules/sankey';
import 'highcharts/modules/treemap';
import 'highcharts/modules/heatmap';
import 'highcharts/modules/funnel';
import 'highcharts/modules/solid-gauge';
import 'highcharts/modules/networkgraph';

/**
 * Chart options type extending Highcharts.Options
 */
export type ChartOptions = Highcharts.Options;

/**
 * Chart configuration service providing default options and theming
 * compatible with Material azure-blue palette.
 */
@Injectable({ providedIn: 'root' })
export class ChartConfigService {
  /**
   * Color palette compatible with Material azure-blue theme
   */
  private readonly colorPalette = [
    '#A2C2FE',
    '#75CA65',
    '#FAC656',
    '#F3393F',
    '#807DFE',
    '#05264A',
    '#58B799',
  ];

  /**
   * Returns the color palette array for use by other services.
   */
  getColorPalette(): readonly string[] {
    return this.colorPalette;
  }

  /**
   * Returns default chart options with responsive sizing,
   * Material-compatible font family, and azure-blue color palette.
   */
  getDefaultOptions(): ChartOptions {
    return {
      chart: {
        animation: {
          duration: 1000,
        },
        style: {
          fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
        },
        backgroundColor: 'transparent',
      },
      colors: this.colorPalette,
      title: {
        text: '',
        style: {
          fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
          fontWeight: '500',
          fontSize: '18px',
          color: '#212121',
        },
      },
      subtitle: {
        style: {
          fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
          color: '#616161',
        },
      },
      xAxis: {
        labels: {
          style: {
            fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
            color: '#616161',
          },
        },
        title: {
          style: {
            fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
            color: '#424242',
          },
        },
        lineColor: '#e0e0e0',
        tickColor: '#e0e0e0',
      },
      yAxis: {
        labels: {
          style: {
            fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
            color: '#616161',
          },
        },
        title: {
          style: {
            fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
            color: '#424242',
          },
        },
        gridLineColor: '#f5f5f5',
      },
      legend: {
        itemStyle: {
          fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
          fontWeight: '400',
          color: '#424242',
        },
        itemHoverStyle: {
          color: '#0078d4',
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#e0e0e0',
        borderRadius: 4,
        shadow: true,
        style: {
          fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
          color: '#212121',
        },
      },
      plotOptions: {
        series: {
          animation: {
            duration: 1000,
          },
        },
      },
      accessibility: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500,
            },
            chartOptions: {
              legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom',
              },
            },
          },
        ],
      },
    };
  }

  /**
   * Merges custom options with default options.
   * Custom options take precedence over defaults.
   *
   * @param customOptions - Chart-specific configuration
   * @returns Merged chart options
   */
  mergeOptions(customOptions: ChartOptions): ChartOptions {
    const defaults = this.getDefaultOptions();

    return this.deepMerge(defaults, customOptions);
  }

  /**
   * Deep merge two objects, with source taking precedence.
   */
  private deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key of Object.keys(source) as (keyof T)[]) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        this.isPlainObject(sourceValue) &&
        this.isPlainObject(targetValue)
      ) {
        result[key] = this.deepMerge(
          targetValue as object,
          sourceValue as object
        ) as T[keyof T];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[keyof T];
      }
    }

    return result;
  }

  /**
   * Check if value is a plain object (not array, null, etc.)
   */
  private isPlainObject(value: unknown): value is object {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.prototype.toString.call(value) === '[object Object]'
    );
  }
}
