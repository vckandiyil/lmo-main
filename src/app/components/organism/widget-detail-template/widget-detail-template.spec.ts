import {sortSeries, sortMultiSeries} from './sort-utils';
import type {WidgetDetailSeriesPoint, MultiSeriesItem} from '../../../core/models/widget-detail.model';

describe('sortSeries', () => {
  const data: WidgetDetailSeriesPoint[] = [
    {year: '2020', value: 30},
    {year: '2021', value: 10},
    {year: '2022', value: 50},
    {year: '2023', value: 20},
  ];

  it('should return data unchanged when direction is null', () => {
    const result = sortSeries(data, null);
    expect(result).toBe(data);
  });

  it('should sort ascending by value', () => {
    const result = sortSeries(data, 'asc');
    expect(result.map(d => d.value)).toEqual([10, 20, 30, 50]);
    expect(result.map(d => d.year)).toEqual(['2021', '2023', '2020', '2022']);
  });

  it('should sort descending by value', () => {
    const result = sortSeries(data, 'desc');
    expect(result.map(d => d.value)).toEqual([50, 30, 20, 10]);
    expect(result.map(d => d.year)).toEqual(['2022', '2020', '2023', '2021']);
  });

  it('should not mutate the original array', () => {
    const original = [...data];
    sortSeries(data, 'asc');
    expect(data).toEqual(original);
  });

  it('should handle empty array', () => {
    expect(sortSeries([], 'asc')).toEqual([]);
    expect(sortSeries([], 'desc')).toEqual([]);
    expect(sortSeries([], null)).toEqual([]);
  });

  it('should handle single element', () => {
    const single = [{year: '2020', value: 42}];
    expect(sortSeries(single, 'asc')).toEqual([{year: '2020', value: 42}]);
    expect(sortSeries(single, 'desc')).toEqual([{year: '2020', value: 42}]);
  });
});

describe('sortMultiSeries', () => {
  const items: MultiSeriesItem[] = [
    {
      name: 'Male',
      color: '#blue',
      data: [
        {year: '2020', value: 10},
        {year: '2021', value: 40},
        {year: '2022', value: 20},
      ],
    },
    {
      name: 'Female',
      color: '#pink',
      data: [
        {year: '2020', value: 5},
        {year: '2021', value: 30},
        {year: '2022', value: 15},
      ],
    },
  ];

  it('should return items unchanged when direction is null', () => {
    const result = sortMultiSeries(items, null);
    expect(result).toBe(items);
  });

  it('should sort ascending by sum of values across series', () => {
    // Sums: 2020=15, 2021=70, 2022=35
    const result = sortMultiSeries(items, 'asc');
    expect(result[0].data.map(d => d.year)).toEqual(['2020', '2022', '2021']);
    expect(result[0].data.map(d => d.value)).toEqual([10, 20, 40]);
    expect(result[1].data.map(d => d.year)).toEqual(['2020', '2022', '2021']);
    expect(result[1].data.map(d => d.value)).toEqual([5, 15, 30]);
  });

  it('should sort descending by sum of values across series', () => {
    const result = sortMultiSeries(items, 'desc');
    expect(result[0].data.map(d => d.year)).toEqual(['2021', '2022', '2020']);
    expect(result[0].data.map(d => d.value)).toEqual([40, 20, 10]);
    expect(result[1].data.map(d => d.year)).toEqual(['2021', '2022', '2020']);
    expect(result[1].data.map(d => d.value)).toEqual([30, 15, 5]);
  });

  it('should not mutate the original items', () => {
    const origData = items.map(s => [...s.data]);
    sortMultiSeries(items, 'asc');
    items.forEach((s, i) => expect(s.data).toEqual(origData[i]));
  });

  it('should handle empty array', () => {
    expect(sortMultiSeries([], 'asc')).toEqual([]);
    expect(sortMultiSeries([], 'desc')).toEqual([]);
    expect(sortMultiSeries([], null)).toEqual([]);
  });

  it('should handle single data point per series', () => {
    const single: MultiSeriesItem[] = [
      {name: 'A', color: '#a', data: [{year: '2020', value: 10}]},
      {name: 'B', color: '#b', data: [{year: '2020', value: 20}]},
    ];
    const result = sortMultiSeries(single, 'asc');
    expect(result[0].data).toEqual([{year: '2020', value: 10}]);
    expect(result[1].data).toEqual([{year: '2020', value: 20}]);
  });

  it('should preserve series names and colors', () => {
    const result = sortMultiSeries(items, 'asc');
    expect(result[0].name).toBe('Male');
    expect(result[0].color).toBe('#blue');
    expect(result[1].name).toBe('Female');
    expect(result[1].color).toBe('#pink');
  });
});
