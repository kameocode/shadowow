import {colors, MarkersSet} from "./marker-set.model";
import {NgZone} from "@angular/core";
import {ShadowCalculatorService} from "../shadow-calculator.service";
import * as _ from "lodash";
import {ShadowShapeCalculator} from "./shadow-shape-calculator.model";
import {XYArray} from "./xy-array.model";
import LatLng = google.maps.LatLng;
import Polygon = google.maps.Polygon;
import PolygonOptions = google.maps.PolygonOptions;


export interface ShadowShape {
  origin: google.maps.Polygon
  shadows?: google.maps.Polygon[]
  heights: number[]
}


export class ShadowShapeSet {
  private shadowShapes: ShadowShape[] = [];
  private readonly markersSet: MarkersSet;
  public map: google.maps.Map;
  public currentShape: ShadowShape;
  private SELECTED_SHAPE_ZINDEX = 200;
  private DEFAULT_HEIGHT = 10;

  private readonly shadowMarkersSet: MarkersSet;

  constructor(map: google.maps.Map) {
    this.map = map;
    this.markersSet = new MarkersSet(this.map);
    this.shadowMarkersSet = new MarkersSet(this.map);
  }


  public createShadows(sunAltitudeRad: number, sunAzimuthRad: number) {
    this.shadowMarkersSet.clearMarkers();
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

    this.printPolygon(mergedShadow.getPath(), sh, holes, "#000000", this.SELECTED_SHAPE_ZINDEX - 2);

    // this.renderOriginShadow(calculator, sh);
  }


  private renderOriginShadow(calculator: ShadowShapeCalculator, sh) {
    let printOriginShadow = false;
    if (printOriginShadow) {
      for (let pp of calculator.shadowBlockPaths) {
        this.printPolygon(pp.getPath(), sh, [],"#11ff0d", this.SELECTED_SHAPE_ZINDEX - 2);
      }
    }
  }

  private renderPartsProblematicToMerge(u: XYArray, mergeIndex: number, sh, points: XYArray) {
    const u1 = u.offset(0.0003 + mergeIndex / 9000, 0).getPath();//calculator.toLatLang(u, 0.0003 + mergeIndex / 9000, 0);
    this.printPolygon(u1, sh, [],"#2bd0ff");
    const u2 = points.offset(0.0003 + mergeIndex / 9000, 0).getPath(); //calculator.toLatLang(points, 0.0003 + mergeIndex / 9000, 0);
    this.printPolygon(u2, sh, [],"#ffe426");
  }

  private static clearShadowShapes(sh) {
    if (sh.shadows != null) {
      sh.shadows.forEach(shape => shape.setMap(null))
    }
    sh.shadows = [];
  }


  private printPolygon(path: LatLng[], sh: ShadowShape, holes: LatLng[][], fillColor: string, zIndex = this.SELECTED_SHAPE_ZINDEX) {
    const shapePolygonTotal = new Polygon();
    if (holes == null || holes.length == 0)
      shapePolygonTotal.setPath(path);
    else
      shapePolygonTotal.setPaths([path, ...holes]);
    shapePolygonTotal.setMap(this.map);
    shapePolygonTotal.setOptions({
      fillColor,
      // fillOpacity: 0.5,
      // strokeWeight: 0,
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
        newShadowShape.heights.push(this.DEFAULT_HEIGHT);
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

    google.maps.event.addListener(shape.getPath(), 'remove_at', () => {
      this.markersSet.createMarkers(shape);
      shadowService.recalculateShadows();


    });
    const debouncedRecreateMarkersAndShadows = _.debounce((shape, shadowService) => {
      this.markersSet.createMarkers(shape);
      shadowService.recalculateShadows();
    }, 250);

    google.maps.event.addListener(shape.getPath(), 'set_at', () =>
      debouncedRecreateMarkersAndShadows(shape, shadowService)
    );

    google.maps.event.addListener(shape.getPath(), 'insert_at', (vertex: number) => {
      this.markersSet.createMarkers(shape);
      const shadowShape = this.shadowShapes.find((s) => s.origin === shape);
      shadowShape.heights.splice(vertex, 0, this.DEFAULT_HEIGHT);
      shadowService.recalculateShadows();
      _ngZone.run(() => this.setSelection(shape, false))
    });

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
      _ngZone.run(()=>
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

  private deleteShadowShape(shadowShape: ShadowShape | undefined) {
    shadowShape.origin.setMap(null);
    ShadowShapeSet.clearShadowShapes(shadowShape);
    this.markersSet.clearMarkers();
    _.remove(this.shadowShapes, shadowShape);
  }

  public toJSON() {
    const arr = [];
    for (let sh of this.shadowShapes) {
      arr.push({
        coords: sh.origin.getPath().getArray().map(ltlng => {
          return {lat: ltlng.lat(), lng: ltlng.lng()}
        }),
        heights: sh.heights
      });
    }
    return JSON.stringify(arr);
  }

  public fromJSON(str: string, _ngZone: NgZone, shadowService: ShadowCalculatorService) {

    this.markersSet.clearMarkers();
    for (let sh of this.shadowShapes) {
      sh.origin.setMap(null);
      sh.shadows.forEach(ssh => ssh.setMap(null));
    }
    this.shadowShapes = [];

    const arr: any[] = JSON.parse(str);
    for (let a of arr) {
      const p = new Polygon({ draggable: true});
      p.setPath(a.coords.map(c => new LatLng(c.lat, c.lng)));
      p.setMap(this.map);
      this.onShapeAdded(p, _ngZone, shadowService, a.heights);
    }
  }
}
