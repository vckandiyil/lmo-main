import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {ChartBuilderService} from './chart-builder.service';
import type {WidgetChartConfig} from '../../core/models/widget-chart-config.model';
import type {ChartBuildContext, WidgetDetailSeriesPoint} from '../../core/models/widget-detail.model';

const SAMPLE_SERIES: WidgetDetailSeriesPoint[] = [
  {year: '2021', value: 10},
  {year: '2022', value: 20},
  {year: '2023', value: 30},
];

const BASE_CTX: ChartBuildContext = {
  forecastEnabled: false,
  forecastSeries: [],
  selectedCompareItems: [],
  relatedSVMap: {},
  forecastRelatedSVMap: {},
  showTooltip: false,
  showDataLabels: true,
};

function makeConfig(type: string): WidgetChartConfig {
  return {type, series: [{name: 'Test', color: '#2563EA'}]};
}

describe('ChartBuilderService', () => {
  let service: ChartBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(ChartBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build a line chart with chart.type = "line"', () => {
    const result = service.build(makeConfig('line'), SAMPLE_SERIES, BASE_CTX);
    expect(result.chart?.type).toBe('line');
    expect((result.series as any[])?.length).toBeGreaterThan(0);
  });

  it('should build a bar chart with chart.type = "bar"', () => {
    const config = {...makeConfig('bar'), orientation: 'horizontal' as const};
    const result = service.build(config, SAMPLE_SERIES, BASE_CTX);
    expect(result.chart?.type).toBe('bar');
  });

  it('should build a column chart with chart.type = "column"', () => {
    const result = service.build(makeConfig('column'), SAMPLE_SERIES, BASE_CTX);
    expect(result.chart?.type).toBe('column');
  });

  it('should build a pie chart with chart.type = "pie"', () => {
    const result = service.build(makeConfig('pie'), SAMPLE_SERIES, BASE_CTX);
    expect(result.chart?.type).toBe('pie');
  });

  it('should build a donut chart via the pie builder', () => {
    const result = service.build(makeConfig('donut'), SAMPLE_SERIES, BASE_CTX);
    expect(result.chart?.type).toBe('pie');
  });

  it('should build a stacked-bar chart when multiSeries is provided', () => {
    const ms = [
      {name: 'A', color: '#f00', data: [{year: '2021', value: 10}, {year: '2022', value: 20}]},
      {name: 'B', color: '#0f0', data: [{year: '2021', value: 15}, {year: '2022', value: 25}]},
    ];
    const ctx: ChartBuildContext = {...BASE_CTX, multiSeries: ms};
    const config: WidgetChartConfig = {type: 'stacked-bar'};
    const result = service.build(config, [], ctx);
    expect(result.chart?.type).toBe('column');
    expect((result.series as any[])?.length).toBe(2);
  });

  it('should build a grouped-column chart when multiSeries is provided', () => {
    const ms = [
      {name: 'A', color: '#f00', data: [{year: '2021', value: 10}]},
      {name: 'B', color: '#0f0', data: [{year: '2021', value: 15}]},
    ];
    const ctx: ChartBuildContext = {...BASE_CTX, multiSeries: ms};
    const config: WidgetChartConfig = {type: 'grouped-column'};
    const result = service.build(config, [], ctx);
    expect(result.chart?.type).toBe('column');
  });

  it('should return empty object for unknown chart type', () => {
    const result = service.build(makeConfig('unknown-type'), SAMPLE_SERIES, BASE_CTX);
    expect(result).toEqual({});
  });

  it('should return empty object for empty series on line chart', () => {
    const result = service.build(makeConfig('line'), [], BASE_CTX);
    expect(result).toEqual({});
  });

  it('should set transparent background for all chart types', () => {
    for (const type of ['line', 'bar', 'column', 'pie']) {
      const result = service.build(makeConfig(type), SAMPLE_SERIES, BASE_CTX);
      if (Object.keys(result).length > 0) {
        expect(result.chart?.backgroundColor).toBe('transparent');
      }
    }
  });

  it('should disable credits for all chart types', () => {
    for (const type of ['line', 'bar', 'column', 'pie']) {
      const result = service.build(makeConfig(type), SAMPLE_SERIES, BASE_CTX);
      if (Object.keys(result).length > 0) {
        expect(result.credits?.enabled).toBe(false);
      }
    }
  });

  // -----------------------------------------------------------------------
  // New chart types
  // -----------------------------------------------------------------------

  describe('heatmap', () => {
    const heatmapCtx: ChartBuildContext = {
      ...BASE_CTX,
      multiSeries: [
        {name: 'IT', color: '#f00', data: [{year: 'Q1', value: 50}, {year: 'Q2', value: 80}]},
        {name: 'Finance', color: '#0f0', data: [{year: 'Q1', value: 30}, {year: 'Q2', value: 60}]},
      ],
    };

    it('should build a heatmap chart', () => {
      const result = service.build(makeConfig('heatmap'), [], heatmapCtx);
      expect(result.chart?.type).toBe('heatmap');
    });

    it('should have colorAxis with min and max', () => {
      const result = service.build(makeConfig('heatmap'), [], heatmapCtx);
      expect((result as any).colorAxis).toBeDefined();
      expect((result as any).colorAxis.min).toBe(30);
      expect((result as any).colorAxis.max).toBe(80);
    });

    it('should produce [x, y, value] data triples', () => {
      const result = service.build(makeConfig('heatmap'), [], heatmapCtx);
      const data = (result.series as any[])?.[0]?.data;
      expect(data.length).toBe(4);
      expect(data[0]).toEqual([0, 0, 50]);
      expect(data[1]).toEqual([1, 0, 80]);
    });

    it('should return empty object when no multiSeries', () => {
      const result = service.build(makeConfig('heatmap'), SAMPLE_SERIES, BASE_CTX);
      expect(result).toEqual({});
    });
  });

  describe('bubble', () => {
    it('should build a bubble chart from series', () => {
      const numericSeries: WidgetDetailSeriesPoint[] = [
        {year: '5000', value: 120},
        {year: '8000', value: 200},
      ];
      const result = service.build(makeConfig('bubble'), numericSeries, BASE_CTX);
      expect(result.chart?.type).toBe('bubble');
      const data = (result.series as any[])?.[0]?.data;
      expect(data.length).toBe(2);
      expect(data[0].x).toBe(5000);
      expect(data[0].y).toBe(120);
      expect(data[0].z).toBe(120);
    });

    it('should return empty for no data', () => {
      const result = service.build(makeConfig('bubble'), [], BASE_CTX);
      expect(result).toEqual({});
    });
  });

  describe('solidgauge', () => {
    it('should build a solid gauge using the last series value', () => {
      const result = service.build(makeConfig('solidgauge'), SAMPLE_SERIES, BASE_CTX);
      expect(result.chart?.type).toBe('solidgauge');
      expect((result.series as any[])?.[0]?.data).toEqual([30]);
    });

    it('should use maxCap from yAxis config', () => {
      const config: WidgetChartConfig = {type: 'solidgauge', yAxis: {maxCap: 200}};
      const result = service.build(config, SAMPLE_SERIES, BASE_CTX);
      expect((result.yAxis as any)?.max).toBe(200);
    });

    it('should default maxCap to 100', () => {
      const result = service.build(makeConfig('solidgauge'), SAMPLE_SERIES, BASE_CTX);
      expect((result.yAxis as any)?.max).toBe(100);
    });
  });

  describe('columnrange', () => {
    const rangeCtx: ChartBuildContext = {
      ...BASE_CTX,
      multiSeries: [
        {name: 'Low', color: '#f00', data: [{year: 'Engineer', value: 5000}, {year: 'Manager', value: 8000}]},
        {name: 'High', color: '#0f0', data: [{year: 'Engineer', value: 12000}, {year: 'Manager', value: 15000}]},
      ],
    };

    it('should build a columnrange chart', () => {
      const result = service.build(makeConfig('columnrange'), [], rangeCtx);
      expect(result.chart?.type).toBe('columnrange');
    });

    it('should produce low/high data pairs', () => {
      const result = service.build(makeConfig('columnrange'), [], rangeCtx);
      const data = (result.series as any[])?.[0]?.data;
      expect(data[0].low).toBe(5000);
      expect(data[0].high).toBe(12000);
      expect(data[1].low).toBe(8000);
      expect(data[1].high).toBe(15000);
    });

    it('should return empty when no multiSeries', () => {
      const result = service.build(makeConfig('columnrange'), SAMPLE_SERIES, BASE_CTX);
      expect(result).toEqual({});
    });
  });

  describe('funnel', () => {
    it('should build a funnel chart', () => {
      const result = service.build(makeConfig('funnel'), SAMPLE_SERIES, BASE_CTX);
      expect(result.chart?.type).toBe('funnel');
    });

    it('should convert series to {name, y} format', () => {
      const result = service.build(makeConfig('funnel'), SAMPLE_SERIES, BASE_CTX);
      const data = (result.series as any[])?.[0]?.data;
      expect(data).toEqual([
        {name: '2021', y: 10},
        {name: '2022', y: 20},
        {name: '2023', y: 30},
      ]);
    });

    it('should return empty for no data', () => {
      const result = service.build(makeConfig('funnel'), [], BASE_CTX);
      expect(result).toEqual({});
    });
  });

  describe('networkgraph', () => {
    const networkCtx: ChartBuildContext = {
      ...BASE_CTX,
      multiSeries: [
        {name: 'Python', color: '#f00', data: [{year: 'SQL', value: 1}, {year: 'R', value: 1}]},
        {name: 'SQL', color: '#0f0', data: [{year: 'Excel', value: 1}]},
      ],
    };

    it('should build a networkgraph chart', () => {
      const result = service.build(makeConfig('networkgraph'), [], networkCtx);
      expect(result.chart?.type).toBe('networkgraph');
    });

    it('should produce {from, to} link data', () => {
      const result = service.build(makeConfig('networkgraph'), [], networkCtx);
      const data = (result.series as any[])?.[0]?.data;
      expect(data).toEqual([
        {from: 'Python', to: 'SQL'},
        {from: 'Python', to: 'R'},
        {from: 'SQL', to: 'Excel'},
      ]);
    });
  });

  describe('spline', () => {
    it('should build a spline chart (based on line)', () => {
      const result = service.build(makeConfig('spline'), SAMPLE_SERIES, BASE_CTX);
      expect(result.chart?.type).toBe('spline');
    });

    it('should have series with type spline', () => {
      const result = service.build(makeConfig('spline'), SAMPLE_SERIES, BASE_CTX);
      expect((result.series as any[])?.[0]?.type).toBe('spline');
    });
  });

  describe('treemap', () => {
    it('should build a treemap chart', () => {
      const result = service.build(makeConfig('treemap'), SAMPLE_SERIES, BASE_CTX);
      expect(result.chart?.type).toBe('treemap');
    });

    it('should produce named data points with colorValue', () => {
      const result = service.build(makeConfig('treemap'), SAMPLE_SERIES, BASE_CTX);
      const data = (result.series as any[])?.[0]?.data;
      expect(data.length).toBe(3);
      expect(data[0].name).toBe('2021');
      expect(data[0].value).toBe(10);
      expect(data[0].colorValue).toBe(0);
    });

    it('should return empty for no data', () => {
      const result = service.build(makeConfig('treemap'), [], BASE_CTX);
      expect(result).toEqual({});
    });
  });

  describe('percent stacking', () => {
    const ms = [
      {name: 'A', color: '#f00', data: [{year: '2021', value: 10}, {year: '2022', value: 20}]},
      {name: 'B', color: '#0f0', data: [{year: '2021', value: 15}, {year: '2022', value: 25}]},
    ];

    it('should use stacking: percent when configured', () => {
      const config: WidgetChartConfig = {type: 'stacked-bar', stacking: 'percent'};
      const ctx: ChartBuildContext = {...BASE_CTX, multiSeries: ms};
      const result = service.build(config, [], ctx);
      expect((result.plotOptions as any)?.column?.stacking).toBe('percent');
    });

    it('should default to stacking: normal', () => {
      const config: WidgetChartConfig = {type: 'stacked-bar'};
      const ctx: ChartBuildContext = {...BASE_CTX, multiSeries: ms};
      const result = service.build(config, [], ctx);
      expect((result.plotOptions as any)?.column?.stacking).toBe('normal');
    });
  });

  // -----------------------------------------------------------------------
  // Detail view: simulate rebuildChart() viewType switching
  // In the detail view, 'bar' is mapped to 'column' when viewTypes exist
  // -----------------------------------------------------------------------
  describe('detail view chart type switching', () => {
    it('should build column chart when activeType is "bar" (viewTypes bar→column mapping)', () => {
      // This is what rebuildChart() does: hasViewTypes && activeType === 'bar' ? 'column' : activeType
      const effectiveConfig = {...makeConfig('column')};
      const result = service.build(effectiveConfig, SAMPLE_SERIES, BASE_CTX);
      expect(result.chart?.type).toBe('column');
      expect((result.series as any[])?.[0]?.type).toBe('column');
    });

    it('should produce valid pie chart in detail view', () => {
      const result = service.build(makeConfig('pie'), SAMPLE_SERIES, BASE_CTX);
      expect(result.chart?.type).toBe('pie');
      const pieData = (result.series as any[])?.[0]?.data;
      expect(pieData?.length).toBe(3);
      expect(pieData[0]).toEqual({name: '2021', y: 10});
      expect(pieData[1]).toEqual({name: '2022', y: 20});
      expect(pieData[2]).toEqual({name: '2023', y: 30});
    });

    it('should produce valid line chart in detail view', () => {
      const result = service.build(makeConfig('line'), SAMPLE_SERIES, BASE_CTX);
      expect(result.chart?.type).toBe('line');
      expect((result.series as any[])?.[0]?.data).toEqual([10, 20, 30]);
    });

    it('should switch between all types producing valid series', () => {
      for (const type of ['line', 'bar', 'column', 'pie']) {
        const result = service.build(makeConfig(type), SAMPLE_SERIES, BASE_CTX);
        expect(Object.keys(result).length).toBeGreaterThan(0);
        expect((result.series as any[])?.length).toBeGreaterThan(0);
      }
    });
  });
});
