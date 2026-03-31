import type {MultiSeriesItem, WidgetDetailSeriesPoint} from '../../../core/models/widget-detail.model';

export type SortDirection = 'asc' | 'desc' | null;

export function sortSeries(
  data: WidgetDetailSeriesPoint[],
  dir: SortDirection,
): WidgetDetailSeriesPoint[] {
  if (!dir) return data;
  return [...data].sort((a, b) => dir === 'asc' ? a.value - b.value : b.value - a.value);
}

export function sortMultiSeries(
  items: MultiSeriesItem[],
  dir: SortDirection,
): MultiSeriesItem[] {
  if (!dir || items.length === 0) return items;
  const indices = items[0].data.map((_, i) => i);
  indices.sort((a, b) => {
    const sumA = items.reduce((sum, s) => sum + (s.data[a]?.value ?? 0), 0);
    const sumB = items.reduce((sum, s) => sum + (s.data[b]?.value ?? 0), 0);
    return dir === 'asc' ? sumA - sumB : sumB - sumA;
  });
  return items.map(s => ({...s, data: indices.map(i => s.data[i])}));
}
