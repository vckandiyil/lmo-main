import {Component, ElementRef, inject, Input, OnChanges, OnInit, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ChartWrapper} from '../../molecule/chart-wrapper/chart-wrapper';
import {ChartOptions} from '../../../shared/services/chart-config.service';

interface SankeyData {
  yearlyData: Record<string, [string, string, number][]>;
  nodes: {id: string; column: number; color: string}[];
}

@Component({
  selector: 'app-gap-analysis-sankey',
  standalone: true,
  imports: [ChartWrapper],
  templateUrl: './gap-analysis-sankey.html',
  styleUrl: './gap-analysis-sankey.scss',
})
export class GapAnalysisSankey implements OnInit, OnChanges {
  private readonly http = inject(HttpClient);
  private readonly el = inject(ElementRef);

  @Input() year = 2026;

  readonly chartOptions = signal<ChartOptions>({});

  private sankeyData: Record<string, [string, string, number][]> = {};
  private sankeyNodes: {id: string; column: number; color: string}[] = [];
  private dataLoaded = false;

  ngOnInit(): void {
    this.http.get<SankeyData>('assets/server-api-jsons/sankey-gap-analysis.json').subscribe(data => {
      this.sankeyData = data.yearlyData;
      this.sankeyNodes = data.nodes;
      this.dataLoaded = true;
      this.buildChart();
    });
  }

  ngOnChanges(): void {
    if (this.dataLoaded) {
      this.buildChart();
    }
  }

  private buildChart(): void {
    this.chartOptions.set({
      chart: {
        backgroundColor: 'transparent',
        height: this.el.nativeElement.offsetHeight || 500,
      } as any,
      title: {text: undefined},
      credits: {enabled: false},
      tooltip: {
        pointFormat: '<b>{point.fromNode.name}</b> → <b>{point.toNode.name}</b>: {point.weight}',
      } as any,
      series: [{
        type: 'sankey',
        keys: ['from', 'to', 'weight'],
        nodes: this.sankeyNodes as any,
        data: this.sankeyData[String(this.year)],
        nodeWidth: 140,
        nodePadding: 28,
        borderWidth: 0,
        curveFactor: 0.45,
        linkOpacity: 0.45,
        dataLabels: {
          enabled: true,
          style: {
            color: '#111',
            textOutline: 'none',
            fontSize: '14px',
            fontWeight: '600',
          },
        },
      }] as any,
    });
  }
}
