import {colors, MarkersSet} from "./marker-set.model";
import {NgZone} from "@angular/core";
import {ShadowCalculatorService} from "../shadow-calculator.service";
import * as _ from "lodash";
import {ShadowShapeCalculator} from "./shadow-shape-calculator.model";
import {XYArray} from "./xy-array.model";
import LatLng = google.maps.LatLng;
import Polygon = google.maps.Polygon;
import PolygonOptions = google.maps.PolygonOptions;
import Marker = google.maps.Marker;


export interface ShadowShape {
  origin: google.maps.Polygon
  shadows?: google.maps.Polygon[]
  heights: number[]
}

export interface ShadowVisualPreferences {
  shadowFillColor: string //#000000
  shadowStrokeWidth: number
}

export class ShadowShapeSet {
  private shadowShapes: ShadowShape[] = [];
  public readonly markersSet: MarkersSet;
  public map: google.maps.Map;
  public currentShape: ShadowShape;
  public currentMarker: Marker;
  private SELECTED_SHAPE_ZINDEX = 200;
  public currentHeight = 10;
  private sunAltitudeRad: number;
  private visualPreferences: ShadowVisualPreferences;


  constructor(map: google.maps.Map, _ngZone: NgZone, preferences: ShadowVisualPreferences) {
    this.map = map;
    this.visualPreferences = preferences;
    this.markersSet = new MarkersSet(this.map, (marker) => {
      const cs = this.currentShape;
      if (cs != null && cs.heights != null) {
        _ngZone.run(() => {
          this.currentMarker = marker;
          if (marker != null) {
            const markerIndex = marker.getLabel() as number - 1;
            this.currentHeight = cs.heights[markerIndex];
          }
        });
      }
    });
  }

  get currentMarkerIndex() {
    if (this.currentMarker != null) {
      const markerIndex = this.currentMarker.getLabel() as number - 1;
      return markerIndex;
    }
    return -1;
  }

  get currentShadowLength() {
    return this.currentHeight / Math.tan(this.sunAltitudeRad);
  }


  public createShadows(sunAltitudeRad: number, sunAzimuthRad: number) {
    this.sunAltitudeRad = sunAltitudeRad;
    for (let sh of this.shadowShapes) {
      ShadowShapeSet.clearShadowShapes(sh);
    }
    if (sunAltitudeRad <= 0) {
      // there is already night
      return;
    }
    for (let sh of this.shadowShapes) {
      this.createShadow(sh, sunAltitudeRad, sunAzimuthRad);
    }

  }


  private createShadow(sh, sunAltitudeRad: number, sunAzimuthRad: number) {
    const calculator = new ShadowShapeCalculator(sh, this.map, sunAltitudeRad, sunAzimuthRad);

    const probablyHoles = new Set<XYArray>();

    const fun = (y: XYArray, mergeIndex: number, points: XYArray) =>
      this.renderPartsProblematicToMerge(y, mergeIndex, sh, points);

    const mergedShadow = calculator.mergeShadowBlocksIntoOne(probablyHoles);
    calculator.substractShadowBlocksFromHoles(probablyHoles);
    calculator.substractOriginFromHoles(probablyHoles);
    const holes = calculator.prepareHoles(mergedShadow, probablyHoles);

    this.printPolygon(mergedShadow.getPath(), sh, holes, this.visualPreferences.shadowFillColor, this.visualPreferences.shadowStrokeWidth, this.SELECTED_SHAPE_ZINDEX - 2);

    // this.renderOriginShadow(calculator, sh);
  }


  private renderOriginShadow(calculator: ShadowShapeCalculator, sh) {
    let printOriginShadow = false;
    if (printOriginShadow) {
      for (let pp of calculator.shadowBlockPaths) {
        this.printPolygon(pp.getPath(), sh, [], "#11ff0d", this.visualPreferences.shadowStrokeWidth, this.SELECTED_SHAPE_ZINDEX - 2);
      }
    }
  }

  private renderPartsProblematicToMerge(u: XYArray, mergeIndex: number, sh, points: XYArray) {
    const u1 = u.offset(0.0003 + mergeIndex / 9000, 0).getPath();//calculator.toLatLang(u, 0.0003 + mergeIndex / 9000, 0);
    this.printPolygon(u1, sh, [], "#2bd0ff", this.visualPreferences.shadowStrokeWidth);
    const u2 = points.offset(0.0003 + mergeIndex / 9000, 0).getPath(); //calculator.toLatLang(points, 0.0003 + mergeIndex / 9000, 0);
    this.printPolygon(u2, sh, [], "#ffe426", this.visualPreferences.shadowStrokeWidth);
  }

  private static clearShadowShapes(sh) {
    if (sh.shadows != null) {
      sh.shadows.forEach(shape => shape.setMap(null))
    }
    sh.shadows = [];
  }


  private printPolygon(path: LatLng[], sh: ShadowShape, holes: LatLng[][], fillColor: string, strokeWeight: number, zIndex = this.SELECTED_SHAPE_ZINDEX) {
    const shapePolygonTotal = new Polygon();
    if (holes == null || holes.length == 0)
      shapePolygonTotal.setPath(path);
    else
      shapePolygonTotal.setPaths([path, ...holes]);
    shapePolygonTotal.setMap(this.map);
    shapePolygonTotal.setOptions({
      fillColor,

      // fillOpacity: 0.5,
      strokeWeight: strokeWeight,
      zIndex
    });
    sh.shadows.push(shapePolygonTotal);
    return shapePolygonTotal;
  }

  public onShapeAdded(shape: google.maps.Polygon, _ngZone: NgZone, shadowService: ShadowCalculatorService, defaultHeights = []) {
    const newShadowShape: ShadowShape = {
      origin: shape,
      heights: defaultHeights
    };
    if (defaultHeights.length == 0) {
      for (let i = 0; i < shape.getPath().getLength(); i++) {
        newShadowShape.heights.push(this.currentHeight);
      }
    }
    this.shadowShapes.push(newShadowShape);
    this.initListeners(shape, _ngZone, shadowService);
  }

  public clearSelection() {
    if (this.currentShape) {
      this.markersSet.clearMarkers();
      this.currentShape.origin.setEditable(false);
      this.currentShape = null;
    }
  }

  private setSelection(shape, toggle ?: boolean) {
    const previousShape = this.currentShape;
    const foundShape = this.shadowShapes.find((s) => s.origin === shape);
    if (previousShape === foundShape && !toggle) {
      return;
    }
    this.clearSelection();
    if (previousShape === foundShape && toggle) {
      return;
    }
    this.markersSet.createMarkers(shape);
    this.currentShape = this.shadowShapes.find((s) => s.origin === shape);
    shape.setEditable(true);
    const options: PolygonOptions = {
      fillColor: colors.colorArea,
      zIndex: this.SELECTED_SHAPE_ZINDEX
    };
    shape.setOptions(options)
  }

  private initListeners(shape: google.maps.Polygon, _ngZone: NgZone, shadowService: ShadowCalculatorService) {
    const debouncedRecreateMarkersAndShadows = this.initPathListeners(shape, shadowService, _ngZone);

    google.maps.event.addListener(shape, 'rightclick', (e) => {
      // check if click was on a vertex control point
      if (e.vertex == undefined) {
        return;
      }

      const shadowShape = this.shadowShapes.find((s) => s.origin === shape);

      if (shadowShape.heights.length <= 2) {
        // if last vertex, remove whole shadowShape (TODO with listeners)
        this.deleteShadowShape(shadowShape);
      } else {
        shadowShape.heights.splice(e.vertex, 1);
        shape.getPath().removeAt(e.vertex);
      }
    });

    google.maps.event.addListener(shape, 'click', () => {
      _ngZone.run(() => this.setSelection(shape, true))
    });

    google.maps.event.addListener(shape, 'dragstart', () => {
      _ngZone.run(() =>
        this.setSelection(shape));
    });
    google.maps.event.addListener(shape, 'dragend', () => {
      debouncedRecreateMarkersAndShadows(shape, shadowService)
    });
    google.maps.event.addListener(shape, 'rightclick', () => {
      //const shadowShape = this.shadowShapes.find(s => s.origin === shape);
      //this.deleteShadowShape(shadowShape);

      //this.clearSelection();
      //shadowService.recalculateShadows();
    });

    _ngZone.run(() => this.setSelection(shape, true));
    shadowService.recalculateShadows();
  }

  private initPathListeners(shape: google.maps.Polygon, shadowService: ShadowCalculatorService, _ngZone: NgZone) {
    google.maps.event.addListener(shape.getPath(), 'remove_at', () => {
      this.markersSet.createMarkers(shape);
      shadowService.recalculateShadows();


    });
    const debouncedRecreateMarkersAndShadows = _.debounce((shape, shadowService) => {
      this.markersSet.createMarkers(shape);
      _ngZone.run(() => {
        console.trace("Recalculate shadows and markers");
        shadowService.recalculateShadows();
      });
    }, 250);

    google.maps.event.addListener(shape.getPath(), 'set_at', () =>
      debouncedRecreateMarkersAndShadows(shape, shadowService)
    );

    google.maps.event.addListener(shape.getPath(), 'insert_at', (vertex: number) => {

      _ngZone.run(() => {
          this.markersSet.createMarkers(shape);
          const shadowShape = this.shadowShapes.find((s) => s.origin === shape);
          shadowShape.heights.splice(vertex, 0, this.currentHeight);
          shadowService.recalculateShadows();
          this.setSelection(shape, false);
        }
      )
    });
    return debouncedRecreateMarkersAndShadows;
  }

  deleteShadowShape(shadowShape: ShadowShape | undefined) {
    shadowShape.origin.setMap(null);
    ShadowShapeSet.clearShadowShapes(shadowShape);
    this.markersSet.clearMarkers();
    _.remove(this.shadowShapes, shadowShape);
  }

  public toJSON(): ShapesJSON {
    const arr = [];
    for (let sh of this.shadowShapes) {
      arr.push({
        coords: sh.origin.getPath().getArray().map(ltlng => {
          return {lat: ltlng.lat(), lng: ltlng.lng()}
        }),
        heights: sh.heights
      });
    }
    return {shapes: arr}
  }

  public fromJSON(str: ShapesJSON, _ngZone: NgZone, shadowService: ShadowCalculatorService) {
    for (let a of str.shapes) {
      const p = new Polygon({draggable: true});
      p.setPath(a.coords.map(c => new LatLng(c.lat, c.lng)));
      p.setMap(this.map);
      this.onShapeAdded(p, _ngZone, shadowService, a.heights);
    }
  }

  moveShape(currentShape: ShadowShape, x: number, y: number, _ngZone: NgZone, shadowService: ShadowCalculatorService) {
    if (currentShape != null) {
      const array = XYArray.fromLatLng(this.map, 0, currentShape.origin.getPath().getArray());
      currentShape.origin.setPath(array.move(x, y).getPath());
      this.currentShape.shadows.forEach(shadow => {
        const newPaths = [];
        shadow.getPaths().forEach(path => {
          const array = XYArray.fromLatLng(this.map, 0, path.getArray());
          newPaths.push(array.move(x, y).getPath());
        });
        shadow.setPaths(newPaths);

      });

      this.markersSet.moveMarkers(x, y);
      this.initPathListeners(currentShape.origin, shadowService, _ngZone);

      shadowService.recalculateShadows();
    } else
      this.markersSet.clearMarkers();
  }

  rotateShape(currentShape: ShadowShape, x: number, _ngZone: NgZone, shadowService: ShadowCalculatorService) {
    if (currentShape != null) {


      const array = XYArray.fromLatLng(this.map, 0, currentShape.origin.getPath().getArray());
      currentShape.origin.setPath(array.rotate(x).getPath());

      this.markersSet.createMarkers(currentShape.origin, true);

      this.initPathListeners(currentShape.origin, shadowService, _ngZone);

      shadowService.recalculateShadows();
    } else
      this.markersSet.clearMarkers();

  }
}

export interface ShapesJSON {
  shapes: {
    coords: { lat: number, lng: number } [],
    heights: number[]
  }[],
  timestamp?: number,
  mapCenterLat?: number,
  mapCenterLng?: number
}
