import {colors, MarkersSet} from "./marker-set.model";
import {NgZone} from "@angular/core";
import {ShadowCalculatorService} from "../shadow-calculator.service";
import * as _ from "lodash";
import {ShadowShapeCalculator} from "./shadow-shape-calculator.model";
import LatLng = google.maps.LatLng;
import Polygon = google.maps.Polygon;
import PolygonOptions = google.maps.PolygonOptions;

const greinerHormann = require('greiner-hormann');

export interface ShadowShape {
  shape: google.maps.Polygon
  shadowShapes?: google.maps.Polygon[]
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
      const polygon = sh.shape;
      ShadowShapeSet.clearShadowShapes(sh);

      const calculator = new ShadowShapeCalculator(this.map, sunAltitudeRad, sunAzimuthRad);

      if (sunAltitudeRad > 0) {
        this.collectPoints(calculator, sh);

        let uu;
        let u;
        let maxCounter = 2;

        u = calculator.toPerturbatedPoint(calculator.rawShadowTopPath)
        // uu = greinerHormann.diff(u, calculator.toPerturbatedPoint2(calculator.rawBasePath));
        //  console.log("Blocks after diff: " + uu.length);


        let counter = 0;
        for (let j = 0; j < calculator.rawShadowBlockPathsArr.length; j++) {
          const points = calculator.toPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]);
          uu = greinerHormann.union(u, points);
          if (uu.length > 1) {
            console.log("ERROR2, union failed " + uu.length + " for index " + j);
            if (++counter < maxCounter)
              j--;
            else
              counter = 0;
          } else {
            u = uu[0];
            calculator.cleanupAfterDegeneracies(u);
            // const pee = greinerHormann.diff(u, calculator.toPerturbatedPoint2(calculator.rawBasePath));
            // const unionPath = calculator.toLatLang(pee[0], 0);
            // const p0 = this.printPolygon(unionPath, "#000000");
            // sh.shadowShapes.push(p0);
          }
        }
        // uu.forEach(u1 => {
        calculator.cleanupAfterDegeneracies(u);

        uu = greinerHormann.diff(u, calculator.toPerturbatedPoint2(calculator.rawBasePath));

        if (uu.length > 1)
          console.log("Blocks after diff: " + uu.length, uu);
        uu.forEach(u => {
          calculator.cleanupAfterDegeneracies(u);
          const unionPath = calculator.toLatLang(u, 0);
          const p0 = this.printPolygon(unionPath, "#000000");
          sh.shadowShapes.push(p0);
        });

        let printOriginShadow = false;
        // this.extracted(calculator, sh);

        if (printOriginShadow) {
          const shapePolygon = this.printPolygon(calculator.rawShadowTopPath, "#ff00ff", this.SELECTED_SHAPE_ZINDEX - 1);
          sh.shadowShapes.push(shapePolygon);
        }
      }
    }
  }


  private collectPoints(calculator: ShadowShapeCalculator, sh: ShadowShape) {
    const polygon = sh.shape;
    for (let i = 0; i < polygon.getPath().getLength(); i++) {
      const point: LatLng = polygon.getPath().getAt(i);
      const shadowPoint = calculator.calculateShadowPoint(sh, i);
      calculator.addBasePoint(point);
      calculator.addShadowTopPoint(shadowPoint);

      // we need to compute shadow blocks for each two consecutive points,
      // in order to property render shadow for protruding parts (between min and max x)
      let j = i + 1;
      if (j >= polygon.getPath().getLength()) {
        j = 0;
      }
      const point2: LatLng = polygon.getPath().getAt(j);
      const shadowPoint2 = calculator.calculateShadowPoint(sh, j);
      calculator.addShadowBlockPath([point, point2, shadowPoint2, shadowPoint]);
    }
  }

  private extracted(calculator: ShadowShapeCalculator, sh) {
    let pu = [];
    const base = calculator.toPerturbatedPoint2(calculator.rawBasePath);
    for (let i = 0; i < calculator.rawShadowBlockPathsArr.length; i++) {
      let p1 = calculator.toPerturbatedPoint2(calculator.rawShadowBlockPathsArr[i]);
      // let ee=greinerHormann.diff(p1, base);
      // console.log("DIFF "+ee.length);
      // p1 = ee[0];
      // calculator.cleanupAfterDegeneracies(p1);


      if (pu.length == 0) {
        pu.push(p1);
      } else {

        const newpu = [];
        pu.forEach(pp => {
          const union = greinerHormann.union(pp, p1);


          // console.log("uno "+union.length);
          union.forEach(u => {
            calculator.cleanupAfterDegeneracies(u);
            // u = greinerHormann.diff(u, base)[0];
            // console.log("u", u);
            calculator.cleanupAfterDegeneracies(u);
            newpu.push(u);


            const latLangPath = calculator.toLatLang(u, 0.0003 + i / 10000 * 2);
            const blockShadowPath = this.printPolygon(latLangPath, "#00ffff");
            sh.shadowShapes.push(blockShadowPath);

          })
        });

        pu = newpu;
        // union.forEach(u=>mergedSoFar.push(u));


      }
    }


    const removed = calculator.toPerturbatedPoint3(calculator.rawBasePath);
    const latLangPath4 = calculator.toLatLang(removed, 0.0003 + calculator.rawShadowBlockPathsArr.length / 10000 * 2);
    // const blockShadowPath4 = this.printPolygon(latLangPath4, "#ff0000");
    // sh.shadowShapes.push(blockShadowPath4);

    pu.forEach(p => {
      // let p=pu[0];

      let pArr = greinerHormann.diff(p, removed);

      console.log("After diff " + pArr.length);
      pArr.forEach(p => {
        //p = pArr[0];

        if (p.length != 0) {
          //console.log("len " + p.length + " " + calculator.equals(p, removed));
          calculator.cleanupAfterDegeneracies(p);
          //console.log("ee", removed);
          //console.log("PP", p);
          const latLangPath = calculator.toLatLang(p, 0.0003 + calculator.rawShadowBlockPathsArr.length / 10000 * 2);
          const blockShadowPath = this.printPolygon(latLangPath, "#fff00f");
          sh.shadowShapes.push(blockShadowPath);
        }

      });
    });
  }

  private static clearShadowShapes(sh) {
    if (sh.shadowShapes != null) {
      sh.shadowShapes.forEach(shape => shape.setMap(null))
    }
    sh.shadowShapes = [];
  }

  private printPolygon(pp: google.maps.LatLng[], fillColor = "#ff0ff0", zIndex = this.SELECTED_SHAPE_ZINDEX) {
    const shapePolygonTotal = new Polygon();
    shapePolygonTotal.setPath(pp);
    shapePolygonTotal.setMap(this.map);
    shapePolygonTotal.setOptions({
      fillColor,
      // fillOpacity: 0.5,
      // strokeWeight: 0,
      zIndex
    });
    return shapePolygonTotal;
  }

  public onShapeAdded(shape: google.maps.Polygon, _ngZone: NgZone, shadowService: ShadowCalculatorService) {
    const newShadowShape: ShadowShape = {
      shape: shape,
      heights: []
    };
    for (let i = 0; i < shape.getPath().getLength(); i++) {
      newShadowShape.heights.push(this.DEFAULT_HEIGHT);
    }
    this.shadowShapes.push(newShadowShape);
    this.initListeners(shape, _ngZone, shadowService);
  }

  public clearSelection() {
    if (this.currentShape) {
      this.markersSet.clearMarkers();
      this.currentShape.shape.setEditable(false);
      this.currentShape = null;
    }
  }

  private setSelection(shape, toggle ?: boolean) {
    const previousShape = this.currentShape;
    const foundShape = this.shadowShapes.find((s) => s.shape === shape);
    if (previousShape === foundShape && !toggle) {
      return;
    }
    this.clearSelection();
    if (previousShape === foundShape && toggle) {
      return;
    }
    this.markersSet.createMarkers(shape);
    this.currentShape = this.shadowShapes.find((s) => s.shape === shape);
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
      const shadowShape = this.shadowShapes.find((s) => s.shape === shape);
      shadowShape.heights.splice(vertex, 0, this.DEFAULT_HEIGHT);
      shadowService.recalculateShadows();
      _ngZone.run(() => this.setSelection(shape, false))
    });

    google.maps.event.addListener(shape, 'rightclick', (e) => {
      // check if click was on a vertex control point
      if (e.vertex == undefined) {
        return;
      }

      const shadowShape = this.shadowShapes.find((s) => s.shape === shape);

      if (shadowShape.heights.length <= 2) {
        // if last vertex, remove whole shadowShape (TODO with listeners)
        const indexToDelete = this.shadowShapes.indexOf(shadowShape);
        shadowShape.shape.setMap(null);
        this.markersSet.clearMarkers();
        this.shadowShapes.splice(indexToDelete, 1);
        ShadowShapeSet.clearShadowShapes(shadowShape);
      } else {
        shadowShape.heights.splice(e.vertex, 1);
        shape.getPath().removeAt(e.vertex);
      }
    });

    google.maps.event.addListener(shape, 'click', () => {
      _ngZone.run(() => this.setSelection(shape, true))
    });

    google.maps.event.addListener(shape, 'dragstart', () => {
      this.setSelection(shape);
    });
    google.maps.event.addListener(shape, 'dragend', () => {
      this.markersSet.createMarkers(shape);
      shadowService.recalculateShadows();
    });

    _ngZone.run(() => this.setSelection(shape, true));
    shadowService.recalculateShadows();
  }
}
