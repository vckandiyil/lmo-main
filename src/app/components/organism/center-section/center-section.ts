import {
  Component,
  inject,
  AfterViewInit,
  OnDestroy,
  viewChild,
  ElementRef,
  signal,
  computed,
} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {CdkDrag, CdkDragDrop, CdkDropList} from '@angular/cdk/drag-drop';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import { MapService, MapViewType, SceneViewType, RegionPopulation } from '../../../shared/services/map.service';
import { WidgetStore, WidgetType, WidgetCatalogService } from '../../../core';
import type { Widget, SidebarPosition } from '../../../core';
import { GenericWidgetCard } from '../../molecule/generic-widget-card/generic-widget-card';
import { Icon } from '../../atom/icon/icon';
import { WIDGET_COMPONENT_MAP } from '../widgets';
import { DynamicWidget } from '../dynamic-widget/dynamic-widget';
import { GapAnalysisFullscreen } from '../supply-and-demand-fullscreen/supply-and-demand-fullscreen';
import { DecimalPipe } from '@angular/common';

interface RegionPopulationData {
  regions: RegionPopulation[];
  total: number;
  year: number;
  unit: string;
}

@Component({
  selector: 'app-center-section',
  standalone: true,
  imports: [TranslateModule, GenericWidgetCard, DynamicWidget, GapAnalysisFullscreen, CdkDropList, CdkDrag, DecimalPipe, Icon],
  templateUrl: './center-section.html',
  styleUrl: './center-section.scss',
})
export class CenterSection implements AfterViewInit, OnDestroy {
  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private readonly mapService = inject(MapService);
  private readonly widgetStore = inject(WidgetStore);
  private readonly catalogService = inject(WidgetCatalogService);
  private readonly expandableTypes = toSignal(
    this.catalogService.getSidebarWidgets().pipe(
      map(entries => new Set(entries.filter(e => e.hasExpandIcon).map(e => e.id)))
    ),
    { initialValue: new Set<string>() }
  );
  private mapView: MapViewType | null = null;
  private sceneView: SceneViewType | null = null;
  private readonly mapStyleUrl = '/assets/map-styles/blue-white-canvas.json';
  private readonly defaultCenter: [number, number] = [54, 24];
  private readonly defaultZoom = 7;
  private clickHandler: __esri.Handle | null = null;
  private pointerMoveHandler: __esri.Handle | null = null;
  private cameraWatchHandler: __esri.WatchHandle | null = null;
  private readonly drillZoomThreshold = 70000;

  readonly centerWidget = this.widgetStore.centerWidget;
  readonly WidgetType = WidgetType;
  readonly centerDropData: Widget[] = [];

  is3DMode = signal(false);
  isTransitioning = signal(false);
  regionData = signal<RegionPopulationData | null>(null);

  drillRegion = signal<RegionPopulation | null>(null);
  drillBreadcrumb = signal<string[]>([]);

  legendRegions = computed(() => {
    const drill = this.drillRegion();
    const data = this.regionData();
    if (!data) return [];
    if (drill?.subRegions) return drill.subRegions;
    return data.regions;
  });

  legendTotal = computed(() => {
    const drill = this.drillRegion();
    const data = this.regionData();
    if (!data) return 0;
    if (drill) return drill.population;
    return data.total;
  });

  legendTitle = computed(() => {
    const drill = this.drillRegion();
    if (drill) return drill.nameKey;
    return 'LMI.POPULATION_3D';
  });

  isCustomWidget(type: WidgetType): boolean {
    return type in WIDGET_COMPONENT_MAP;
  }

  restoreFromCenter(): void {
    this.widgetStore.restoreFromCenter();
  }

  canDropInCenter = (drag: CdkDrag<Widget>): boolean => {
    return drag.data.type === WidgetType.Map || this.expandableTypes().has(drag.data.type);
  };

  onCenterDrop(event: CdkDragDrop<Widget[]>): void {
    const draggedWidget = event.item.data as Widget;
    const leftWidgets = this.widgetStore.leftWidgets();
    const rightWidgets = this.widgetStore.rightWidgets();

    const leftIdx = leftWidgets.findIndex(w => w.id === draggedWidget.id);
    if (leftIdx >= 0) {
      this.widgetStore.swapWithCenter('left', leftIdx);
      return;
    }

    const rightIdx = rightWidgets.findIndex(w => w.id === draggedWidget.id);
    if (rightIdx >= 0) {
      this.widgetStore.swapWithCenter('right', rightIdx);
    }
  }

  isAtMinZoom = signal(true);

  zoomIn(): void {
    if (this.is3DMode()) return;
    if (this.mapView) {
      this.mapView.goTo({ zoom: this.mapView.zoom + 1 });
    }
  }

  zoomOut(): void {
    if (this.is3DMode()) return;
    if (this.mapView && !this.isAtMinZoom()) {
      this.mapView.goTo({ zoom: this.mapView.zoom - 1 });
    }
  }

  resetView(): void {
    if (this.is3DMode()) {
      this.sceneView?.goTo(
        {
          position: {
            x: this.defaultCenter[0],
            y: this.defaultCenter[1] - 1.5,
            z: 120000,
          },
          tilt: 55,
          heading: 0,
        },
        { duration: 1200, easing: 'in-out-cubic' as any }
      );
    } else if (this.mapView) {
      this.mapView.goTo({
        center: this.defaultCenter,
        zoom: this.defaultZoom,
      });
    }
  }

  expandFullscreen(): void {
    const container = this.mapContainer().nativeElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }

  async toggle3DMode(): Promise<void> {
    if (this.isTransitioning()) return;
    this.isTransitioning.set(true);

    try {
      if (this.is3DMode()) {
        this.drillRegion.set(null);
        this.drillBreadcrumb.set([]);
        await this.switchTo2D();
      } else {
        await this.switchTo3D();
      }
    } finally {
      this.isTransitioning.set(false);
    }
  }

  async drillBack(): Promise<void> {
    if (!this.sceneView || this.isTransitioning()) return;
    this.isTransitioning.set(true);

    try {
      this.drillRegion.set(null);
      this.drillBreadcrumb.set([]);

      const map = this.sceneView.map;
      this.mapService.removePopulationLayer(map, 'Population 3D Sub');
      this.mapService.removePopulationLayer(map, 'Population 3D');

      const data = this.regionData();
      if (data) {
        await this.mapService.addPopulationColumns(
          this.sceneView,
          data.regions,
          'Population 3D',
          40000,
          0.05
        );
      }
    } finally {
      this.isTransitioning.set(false);
    }
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    this.loadRegionData();
  }

  ngOnDestroy(): void {
    this.disposeClickHandler();
    if (this.mapView) {
      this.mapView.destroy();
      this.mapView = null;
    }
    if (this.sceneView) {
      this.sceneView.destroy();
      this.sceneView = null;
    }
  }

  private disposeClickHandler(): void {
    this.clickHandler?.remove();
    this.clickHandler = null;
    this.pointerMoveHandler?.remove();
    this.pointerMoveHandler = null;
    this.cameraWatchHandler?.remove();
    this.cameraWatchHandler = null;
  }

  private async loadRegionData(): Promise<void> {
    try {
      const response = await fetch('/assets/server-api-jsons/regionPopulation.json');
      const data: RegionPopulationData = await response.json();
      this.regionData.set(data);
    } catch {
      // Silently handle - 3D mode will work without the legend
    }
  }

  private async createFreshMap(): Promise<__esri.Map> {
    return this.mapService.createMapFromStyle(this.mapStyleUrl);
  }

  private async initializeMap(): Promise<void> {
    const container = this.mapContainer().nativeElement;
    const map = await this.createFreshMap();
    this.mapView = await this.mapService.createMapViewFromMap(container, map);

    this.mapView.watch('zoom', (zoom: number) => {
      this.isAtMinZoom.set(zoom <= this.defaultZoom);
    });

    this.mapView.on('drag', (event) => {
      if (this.isAtMinZoom()) {
        event.stopPropagation();
      }
    });
  }

  private setupZoomWatcher(): void {
    this.disposeClickHandler();
    if (!this.sceneView) return;

    this.cameraWatchHandler = this.sceneView.watch('camera', (camera: __esri.Camera) => {
      if (this.isTransitioning()) return;

      const z = camera.position.z;

      if (!this.drillRegion() && z < this.drillZoomThreshold) {
        const nearest = this.findNearestRegion(camera.position.longitude, camera.position.latitude);
        if (nearest?.subRegions?.length) {
          this.drillInto(nearest.name);
        }
      } else if (this.drillRegion() && z > this.drillZoomThreshold) {
        this.drillBack();
      }
    });
  }

  private findNearestRegion(lon: number, lat: number): RegionPopulation | null {
    const data = this.regionData();
    if (!data) return null;

    let nearest: RegionPopulation | null = null;
    let minDist = Infinity;

    for (const region of data.regions) {
      const dx = region.longitude - lon;
      const dy = region.latitude - lat;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        nearest = region;
      }
    }

    return nearest;
  }

  private async drillInto(regionName: string): Promise<void> {
    const data = this.regionData();
    if (!data || !this.sceneView) return;

    const region = data.regions.find(r => r.name === regionName);
    if (!region?.subRegions?.length) return;

    this.isTransitioning.set(true);

    try {
      this.mapService.removePopulationLayer(this.sceneView.map, 'Population 3D');

      await this.mapService.addPopulationColumns(
        this.sceneView,
        region.subRegions,
        'Population 3D Sub',
        12000,
        0.015
      );

      this.drillRegion.set(region);
      this.drillBreadcrumb.set([region.name]);
    } finally {
      this.isTransitioning.set(false);
    }
  }

  private async switchTo3D(): Promise<void> {
    const container = this.mapContainer().nativeElement;

    if (this.mapView) {
      this.mapView.destroy();
      this.mapView = null;
    }

    const map = await this.createFreshMap();
    this.sceneView = await this.mapService.createSceneViewFromMap(
      container,
      map,
      this.defaultCenter,
      this.defaultZoom
    );

    const data = this.regionData();
    if (data) {
      await this.mapService.addPopulationColumns(
        this.sceneView,
        data.regions,
        'Population 3D',
        40000,
        0.05
      );
      this.setupZoomWatcher();
    }

    this.is3DMode.set(true);
  }

  private async switchTo2D(): Promise<void> {
    const container = this.mapContainer().nativeElement;

    this.disposeClickHandler();

    if (this.sceneView) {
      this.sceneView.destroy();
      this.sceneView = null;
    }

    const map = await this.createFreshMap();
    this.mapView = await this.mapService.createMapViewFromMap(
      container,
      map,
      this.defaultCenter,
      this.defaultZoom
    );

    this.mapView.watch('zoom', (zoom: number) => {
      this.isAtMinZoom.set(zoom <= this.defaultZoom);
    });

    this.mapView.on('drag', (event) => {
      if (this.isAtMinZoom()) {
        event.stopPropagation();
      }
    });

    this.is3DMode.set(false);
  }
}
