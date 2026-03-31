import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {MiniChartBuilderService} from './mini-chart-builder.service';
import type {WidgetChartConfig} from '../../core/models/widget-chart-config.model';
import type {MultiSeriesItem, WidgetDetailSeriesPoint} from '../../core/models/widget-detail.model';

const SAMPLE_SERIES: WidgetDetailSeriesPoint[] = [
  {year: '2021', value: 100},
  {year: '2022', value: 200},
  {year: '2023', value: 300},
];

const MULTI_SERIES: MultiSeriesItem[] = [
  {name: 'Group A', color: '#f00', data: [{year: '2021', value: 10}, {year: '2022', value: 20}]},
  {name: 'Group B', color: '#0f0', data: [{year: '2021', value: 15}, {year: '2022', value: 25}]},
];

function makeConfig(type: string): WidgetChartConfig {
  return {type, series: [{name: 'Test', color: '#2563EA'}]};
}

describe('MiniChartBuilderService', () => {
  let service: MiniChartBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(MiniChartBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build a line chart for type "line"', () => {
    const result = service.build(makeConfig('line'), SAMPLE_SERIES, undefined, '%', false);
    expect(result.chart?.type).toBe('line');
  });

  it('should convert "bar" to "column" in mini cards', () => {
    const result = service.build(makeConfig('bar'), SAMPLE_SERIES, undefined, '%', false);
    expect(result.chart?.type).toBe('column');
  });

  it('should keep "column" as "column"', () => {
    const result = service.build(makeConfig('column'), SAMPLE_SERIES, undefined, '%', false);
    expect(result.chart?.type).toBe('column');
  });

  it('should build a pie chart for type "pie"', () => {
    const result = service.build(makeConfig('pie'), SAMPLE_SERIES, undefined, '%', false);
    expect(result.chart?.type).toBe('pie');
  });

  it('should build a pie chart for type "donut"', () => {
    const result = service.build(makeConfig('donut'), SAMPLE_SERIES, undefined, '%', false);
    expect(result.chart?.type).toBe('pie');
  });

  it('should build stacked-bar with multiSeries', () => {
    const result = service.build(makeConfig('stacked-bar'), [], MULTI_SERIES, '', false);
    expect(result.chart?.type).toBe('column');
    expect((result.series as any[])?.length).toBe(2);
  });

  it('should build horizontal stacked-bar when orientation is horizontal', () => {
    const config: WidgetChartConfig = {type: 'stacked-bar', orientation: 'horizontal'};
    const result = service.build(config, [], MULTI_SERIES, '', false);
    expect(result.chart?.type).toBe('bar');
  });

  it('should build grouped-column with multiSeries', () => {
    const result = service.build(makeConfig('grouped-column'), [], MULTI_SERIES, '', false);
    expect(result.chart?.type).toBe('column');
  });

  it('should set transparent background', () => {
    const result = service.build(makeConfig('line'), SAMPLE_SERIES, undefined, '%', false);
    expect(result.chart?.backgroundColor).toBe('transparent');
  });

  it('should set chart height to 200 when not center', () => {
    const result = service.build(makeConfig('line'), SAMPLE_SERIES, undefined, '%', false);
    expect(result.chart?.height).toBe(200);
  });

  it('should not fix chart height when isCenter is true', () => {
    const result = service.build(makeConfig('line'), SAMPLE_SERIES, undefined, '%', true);
    expect(result.chart?.height).toBeUndefined();
  });

  it('should include series data for cartesian charts', () => {
    const result = service.build(makeConfig('line'), SAMPLE_SERIES, undefined, '%', false);
    const seriesData = (result.series as any[])?.[0]?.data;
    expect(seriesData).toEqual([100, 200, 300]);
  });

  it('should use year categories for xAxis', () => {
    const result = service.build(makeConfig('column'), SAMPLE_SERIES, undefined, '%', false);
    expect((result.xAxis as any)?.categories).toEqual(['2021', '2022', '2023']);
  });

  // -----------------------------------------------------------------------
  // New chart type fallbacks
  // -----------------------------------------------------------------------

  describe('native mini chart rendering', () => {
    it('should render treemap as real treemap', () => {
      const result = service.build(makeConfig('treemap'), SAMPLE_SERIES, undefined, '', false);
      expect(result.chart?.type).toBe('treemap');
      expect((result.series as any[])?.[0]?.type).toBe('treemap');
    });

    it('should render funnel as real funnel', () => {
      const result = service.build(makeConfig('funnel'), SAMPLE_SERIES, undefined, '', false);
      expect(result.chart?.type).toBe('funnel');
    });

    it('should render solidgauge as real solidgauge', () => {
      const result = service.build(makeConfig('solidgauge'), SAMPLE_SERIES, undefined, '', false);
      expect(result.chart?.type).toBe('solidgauge');
    });

    it('should render heatmap as real heatmap from multiSeries', () => {
      const result = service.build(makeConfig('heatmap'), [], MULTI_SERIES, '', false);
      expect(result.chart?.type).toBe('heatmap');
    });

    it('should render networkgraph from multiSeries', () => {
      const result = service.build(makeConfig('networkgraph'), [], MULTI_SERIES, '', false);
      expect(result.chart?.type).toBe('networkgraph');
    });

    it('should render bubble as real bubble', () => {
      const bubbleSeries: WidgetDetailSeriesPoint[] = [
        {year: '5000', value: 120},
        {year: '8000', value: 200},
      ];
      const result = service.build(makeConfig('bubble'), bubbleSeries, undefined, '', false);
      expect(result.chart?.type).toBe('bubble');
    });

    it('should render spline as real spline', () => {
      const result = service.build(makeConfig('spline'), SAMPLE_SERIES, undefined, '', false);
      expect(result.chart?.type).toBe('spline');
    });

    it('should render spline from multiSeries with multiple lines', () => {
      const result = service.build(makeConfig('spline'), [], MULTI_SERIES, '', false);
      expect(result.chart?.type).toBe('spline');
      expect((result.series as any[])?.length).toBe(2);
    });

    it('should render columnrange from multiSeries', () => {
      const result = service.build(makeConfig('columnrange'), [], MULTI_SERIES, '', false);
      expect(result.chart?.type).toBe('columnrange');
    });

    it('should set mini height and transparent background', () => {
      const result = service.build(makeConfig('treemap'), SAMPLE_SERIES, undefined, '', false);
      expect(result.chart?.height).toBe(200);
      expect(result.chart?.backgroundColor).toBe('transparent');
    });

    it('should disable legend for networkgraph', () => {
      const result = service.build(makeConfig('networkgraph'), [], MULTI_SERIES, '', false);
      expect(result.legend?.enabled).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // End-to-end: simulate onChartTypeChange for every viewType
  // This mirrors what GenericWidgetCard does: {...config, type} → build()
  // -----------------------------------------------------------------------
  describe('viewType switching (simulates onChartTypeChange)', () => {
    const ORIGINAL_CONFIG: WidgetChartConfig = {
      type: 'line',
      series: [{name: 'Vacancy Rate', color: '#2563EA'}],
    };

    it('should produce a valid line chart when switching to "line"', () => {
      const result = service.build({...ORIGINAL_CONFIG, type: 'line'}, SAMPLE_SERIES, undefined, '%', false);
      expect(result.chart?.type).toBe('line');
      expect((result.series as any[])?.length).toBeGreaterThan(0);
      expect((result.series as any[])?.[0]?.data).toEqual([100, 200, 300]);
    });

    it('should produce a valid column chart when switching to "bar"', () => {
      const result = service.build({...ORIGINAL_CONFIG, type: 'bar'}, SAMPLE_SERIES, undefined, '%', false);
      expect(result.chart?.type).toBe('column');
      expect((result.series as any[])?.length).toBeGreaterThan(0);
      expect((result.series as any[])?.[0]?.data).toEqual([100, 200, 300]);
      expect((result.xAxis as any)?.categories).toEqual(['2021', '2022', '2023']);
    });

    it('should produce a valid pie chart when switching to "pie"', () => {
      const result = service.build({...ORIGINAL_CONFIG, type: 'pie'}, SAMPLE_SERIES, undefined, '%', false);
      expect(result.chart?.type).toBe('pie');
      const pieData = (result.series as any[])?.[0]?.data;
      expect(pieData?.length).toBe(3);
      expect(pieData[0]).toEqual({name: '2021', y: 100});
      expect(pieData[1]).toEqual({name: '2022', y: 200});
      expect(pieData[2]).toEqual({name: '2023', y: 300});
    });

    it('should produce valid charts for every switch in sequence: line → bar → pie → line', () => {
      const lineResult = service.build({...ORIGINAL_CONFIG, type: 'line'}, SAMPLE_SERIES, undefined, '%', false);
      expect(lineResult.chart?.type).toBe('line');

      const barResult = service.build({...ORIGINAL_CONFIG, type: 'bar'}, SAMPLE_SERIES, undefined, '%', false);
      expect(barResult.chart?.type).toBe('column');

      const pieResult = service.build({...ORIGINAL_CONFIG, type: 'pie'}, SAMPLE_SERIES, undefined, '%', false);
      expect(pieResult.chart?.type).toBe('pie');

      const lineAgain = service.build({...ORIGINAL_CONFIG, type: 'line'}, SAMPLE_SERIES, undefined, '%', false);
      expect(lineAgain.chart?.type).toBe('line');
    });

    it('should produce non-empty series for all viewTypes', () => {
      for (const type of ['line', 'bar', 'pie']) {
        const result = service.build({...ORIGINAL_CONFIG, type}, SAMPLE_SERIES, undefined, '%', false);
        expect((result.series as any[])?.length).toBeGreaterThan(0);
      }
    });

    it('should produce valid column chart from a widget with original chartType "column"', () => {
      const columnConfig: WidgetChartConfig = {type: 'column', series: [{name: 'Vacancies', color: '#2563EA'}]};
      // Switch to line
      const lineResult = service.build({...columnConfig, type: 'line'}, SAMPLE_SERIES, undefined, '', false);
      expect(lineResult.chart?.type).toBe('line');
      // Switch to bar (renders as column)
      const barResult = service.build({...columnConfig, type: 'bar'}, SAMPLE_SERIES, undefined, '', false);
      expect(barResult.chart?.type).toBe('column');
      // Switch to pie
      const pieResult = service.build({...columnConfig, type: 'pie'}, SAMPLE_SERIES, undefined, '', false);
      expect(pieResult.chart?.type).toBe('pie');
    });

    it('should handle multi-series widgets correctly (no line/bar/pie switch)', () => {
      const stackedConfig: WidgetChartConfig = {type: 'stacked-bar'};
      const result = service.build(stackedConfig, [], MULTI_SERIES, '', false);
      expect(result.chart?.type).toBe('column');
      expect((result.series as any[])?.length).toBe(2);
    });
  });
});
