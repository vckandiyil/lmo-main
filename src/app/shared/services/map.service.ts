import { Injectable } from '@angular/core';

/**
 * Type alias for ArcGIS MapView (lazy-loaded)
 */
export type MapViewType = __esri.MapView;

/**
 * Type alias for ArcGIS SceneView (lazy-loaded)
 */
export type SceneViewType = __esri.SceneView;

/**
 * Type alias for ArcGIS WebMap (lazy-loaded)
 */
export type WebMapType = __esri.WebMap;

/**
 * Type alias for ArcGIS Map (lazy-loaded)
 */
export type MapType = __esri.Map;

export interface RegionPopulation {
  name: string;
  nameKey: string;
  population: number;
  longitude: number;
  latitude: number;
  color: [number, number, number, number];
  subRegions?: RegionPopulation[];
}

@Injectable({ providedIn: 'root' })
export class MapService {
  private configInitialized = false;

  private async ensureConfig(): Promise<void> {
    if (this.configInitialized) return;

    const esriConfig = await import('@arcgis/core/config').then(m => m.default);
    esriConfig.assetsPath = '/assets/arcgis';
    this.configInitialized = true;
  }

  async createWebMap(portalItemId: string): Promise<WebMapType> {
    await this.ensureConfig();

    const WebMap = await import('@arcgis/core/WebMap').then(m => m.default);
    return new WebMap({
      portalItem: {
        id: portalItemId,
      },
    });
  }

  async createMapFromStyle(styleUrl: string): Promise<MapType> {
    await this.ensureConfig();

    const [Map, Basemap, VectorTileLayer] = await Promise.all([
      import('@arcgis/core/Map').then(m => m.default),
      import('@arcgis/core/Basemap').then(m => m.default),
      import('@arcgis/core/layers/VectorTileLayer').then(m => m.default),
    ]);

    const vectorTileLayer = new VectorTileLayer({ url: styleUrl });
    const basemap = new Basemap({ baseLayers: [vectorTileLayer] });

    return new Map({ basemap });
  }

  async createMapView(container: HTMLDivElement, webMap: WebMapType): Promise<MapViewType> {
    await this.ensureConfig();

    const MapView = await import('@arcgis/core/views/MapView').then(m => m.default);
    return new MapView({
      container,
      map: webMap,
    });
  }

  async createMapViewFromMap(
    container: HTMLDivElement,
    map: MapType,
    center: [number, number] = [54, 24],
    zoom = 7
  ): Promise<MapViewType> {
    await this.ensureConfig();

    const MapView = await import('@arcgis/core/views/MapView').then(m => m.default);
    const view = new MapView({
      container,
      map,
      center,
      zoom,
      ui: { components: [] },
      constraints: {
        minZoom: zoom,
      },
    });

    return view;
  }

  async createSceneViewFromMap(
    container: HTMLDivElement,
    map: MapType,
    center: [number, number] = [54, 24],
    zoom = 7
  ): Promise<SceneViewType> {
    await this.ensureConfig();

    const SceneView = await import('@arcgis/core/views/SceneView').then(m => m.default);
    const view = new SceneView({
      container,
      map,
      camera: {
        position: { x: center[0], y: center[1] - 1.5, z: 120000 },
        tilt: 55,
        heading: 0,
      },
      ui: { components: [] },
      environment: {
        atmosphere: { quality: 'high' },
        lighting: {
          type: 'virtual',
        },
      },
      popup: { autoOpenEnabled: false },
    });

    await view.when();
    return view;
  }

  async addPopulationColumns(
    sceneView: SceneViewType,
    regions: RegionPopulation[],
    layerTitle = 'Population 3D',
    maxHeight = 40000,
    ringRadius = 0.08
  ): Promise<__esri.GraphicsLayer> {
    await this.ensureConfig();

    const [GraphicsLayer, Graphic, PolygonSymbol3D, ExtrudeSymbol3DLayer, PointSymbol3D, TextSymbol3DLayer, ObjectSymbol3DLayer] =
      await Promise.all([
        import('@arcgis/core/layers/GraphicsLayer').then(m => m.default),
        import('@arcgis/core/Graphic').then(m => m.default),
        import('@arcgis/core/symbols/PolygonSymbol3D').then(m => m.default),
        import('@arcgis/core/symbols/ExtrudeSymbol3DLayer').then(m => m.default),
        import('@arcgis/core/symbols/PointSymbol3D').then(m => m.default),
        import('@arcgis/core/symbols/TextSymbol3DLayer').then(m => m.default),
        import('@arcgis/core/symbols/ObjectSymbol3DLayer').then(m => m.default),
      ]);

    const graphicsLayer = new GraphicsLayer({ title: layerTitle });
    const maxPopulation = Math.max(...regions.map(r => r.population));

    for (const region of regions) {
      const height = (region.population / maxPopulation) * maxHeight;
      const sides = 36;
      const ring: number[][] = [];
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * 2 * Math.PI;
        ring.push([
          region.longitude + ringRadius * Math.cos(angle),
          region.latitude + ringRadius * Math.sin(angle),
        ]);
      }

      const polygon = {
        type: 'polygon' as const,
        rings: [ring],
      };

      const symbol = new PolygonSymbol3D({
        symbolLayers: [
          new ExtrudeSymbol3DLayer({
            size: height,
            material: {
              color: region.color,
            },
            edges: {
              type: 'solid',
              color: [255, 255, 255, 0.3],
              size: 1,
            } as any,
          }),
        ],
      });

      const graphic = new Graphic({
        geometry: polygon as any,
        symbol,
        attributes: {
          name: region.name,
          nameKey: region.nameKey,
          population: region.population,
          hasSubRegions: !!(region.subRegions && region.subRegions.length > 0),
        },
      });

      graphicsLayer.add(graphic);

      const labelSymbol = new PointSymbol3D({
        symbolLayers: [
          new TextSymbol3DLayer({
            text: region.name,
            material: { color: [255, 255, 255, 1] },
            font: {
              size: 10,
              weight: 'bold',
            },
            halo: {
              color: [0, 0, 0, 0.7],
              size: 1.5,
            },
          }),
        ],
        verticalOffset: {
          screenLength: 20,
          maxWorldLength: 5000,
          minWorldLength: 1000,
        } as any,
        callout: {
          type: 'line',
          size: 1,
          color: [255, 255, 255, 0.6],
        } as any,
      });

      const labelGraphic = new Graphic({
        geometry: {
          type: 'point',
          x: region.longitude,
          y: region.latitude,
          z: height,
        } as any,
        symbol: labelSymbol,
        attributes: {
          name: region.name,
          isLabel: true,
        },
      });

      graphicsLayer.add(labelGraphic);
    }

    sceneView.map.add(graphicsLayer);
    return graphicsLayer;
  }

  removePopulationLayer(map: MapType, layerTitle = 'Population 3D'): void {
    const layer = map.layers.find(l => l.title === layerTitle);
    if (layer) {
      map.remove(layer);
    }
  }

  async hitTestPopulationGraphic(
    sceneView: SceneViewType,
    screenPoint: { x: number; y: number },
    layerTitle = 'Population 3D'
  ): Promise<{ name: string; nameKey: string; population: number; hasSubRegions: boolean } | null> {
    const result = await sceneView.hitTest(screenPoint);
    const graphicHit = result.results.find(
      (r: any) => r.type === 'graphic' && r.graphic?.layer?.title === layerTitle
    ) as any;

    if (graphicHit?.graphic?.attributes) {
      return {
        name: graphicHit.graphic.attributes.name,
        nameKey: graphicHit.graphic.attributes.nameKey,
        population: graphicHit.graphic.attributes.population,
        hasSubRegions: graphicHit.graphic.attributes.hasSubRegions,
      };
    }
    return null;
  }
}
