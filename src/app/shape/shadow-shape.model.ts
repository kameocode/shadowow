import {colors, MarkersSet} from "./marker-set.model";
import {NgZone} from "@angular/core";
import {ShadowCalculatorService} from "../shadow-calculator.service";
import * as _ from "lodash";
import {ShadowShapeCalculator} from "./shadow-shape-calculator.model";
import {TransformablePoint} from "./tranformable-point.model";
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

        u = calculator.toNotPerturbatedPoint(calculator.rawShadowTopPath);

       // u = calculator.toNotPerturbatedPoint(calculator.rawShadowBlockPathsArr[0]);


        const finalShadows = new Set();
        const problematicToRemove = new Set();

        let counter = 0;
        let mergeIndex = 0;
        for (let j = 0; j < calculator.rawShadowBlockPathsArr.length; j++) {
          const points = calculator.toPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]);


          uu = greinerHormann.union(u, points);

          if (uu.length > 1) {


            console.log("ERROR2, union failed " + uu.length + " for index " + j + " ");
            if (++counter < maxCounter) {
              j--;
            } else {
              //finalShadows.add(points);
              counter = 0;
              const inside = points.filter(po => calculator.inside(po, u)).length;
              //console.log("is inside "+inside+" "+points.length);


              // display what parts are problematic to merge
              mergeIndex++;
              this.displayProblematicParts(calculator, u, mergeIndex, sh, points);

              const area1 = calculator.calcPolygonArea(uu[0]);
              const area2 = calculator.calcPolygonArea(uu[1]);
              //console.log("area "+area1+" "+area2);
              if (area1 > area2) {
                u = uu[0];
                problematicToRemove.add(uu[1]);
                calculator.reverseToNotPerturbatedPoints(uu[0], points, calculator.toNotPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]));
                calculator.reverseToNotPerturbatedPoints(uu[1], points, calculator.toNotPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]));

              } else {
                u = uu[1];
                problematicToRemove.add(uu[0]);
                calculator.reverseToNotPerturbatedPoints(uu[0], points, calculator.toNotPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]));
                calculator.reverseToNotPerturbatedPoints(uu[1], points, calculator.toNotPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]));
              }

              const u3 = calculator.toLatLang(uu[0], 0.0002 + ++mergeIndex / 9000, 0);
              this.printPolygon(u3, sh, "#ff9bfc");

              const u4 = calculator.toLatLang(uu[1], 0.0002 + mergeIndex / 9000, 0.00015);
              this.printPolygon(u4, sh, "#ff9bfc");

            }
          } else {
            u = uu[0];
            calculator.reverseToNotPerturbatedPoints(u, points, calculator.toNotPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]));
            // calculator.cleanupAfterDegeneracies(u);

          }
        }


        if (uu.length > 1)
          console.log("Blocks after diff: " + uu.length, uu);
        uu.forEach(u => {
          finalShadows.add(u);
        });
        const rawBasePathPerturbated = calculator.toPerturbatedPoint2(calculator.rawBasePath);
        this.makeDiffAndRemoveIfEmpty(problematicToRemove, rawBasePathPerturbated, calculator, sh);
        //this.makeDiff(problematicToRemove, rawBasePathPerturbated, calculator);


        // this.makeUnions(finalShadows, calculator, sh);


        let problematicToRemoveArrLatLang = [];
        problematicToRemove.forEach(p => {
          problematicToRemoveArrLatLang.push([...calculator.toLatLang(p, 0)].reverse());
        });
        // problematicToRemoveArrLatLang = [];
        problematicToRemoveArrLatLang.push([...calculator.rawBasePath].reverse());


        /*        let pco=0;
                problematicToRemove.forEach(p=>{
                  const u4 = calculator.toLatLang(p, 0.0002 + pco++ / 9000, 0.0004);
                this.printPolygon(u4, sh,"#19ff54");
                });*/

        finalShadows.forEach(u => {
          calculator.reverseToNotPerturbatedPoints(u, rawBasePathPerturbated, calculator.toNotPerturbatedPoint(calculator.rawBasePath));
          calculator.cleanupAfterDegeneracies(u);
          const unionPath = calculator.toLatLang(u, 0);

          if (problematicToRemoveArrLatLang.length > 0) {
            const s1 = google.maps.geometry.spherical.computeSignedArea(unionPath);

            //console.log("HERE", problematicToRemoveArrLatLang);
            let holes = problematicToRemoveArrLatLang.map(e => {

              let s2 = google.maps.geometry.spherical.computeSignedArea(e);
              //console.log("areaaa "+s1+" "+s2);

              const basePoints = calculator.toNotPerturbatedPoint(calculator.rawBasePath);
              const ePoints = calculator.toNotPerturbatedPoint(e);

              const inside = ePoints.filter(po => calculator.inside(po, basePoints)).length;
              // console.log("AAis inside "+inside+" "+ePoints.length);
              if (inside == ePoints.length) {
                //return null;
              }

              if ((s1 > 0 && s2 > 0) || (s1 < 0 && s2 < 0)) {
                e = [...e].reverse();
                s2 = google.maps.geometry.spherical.computeSignedArea(e);
                //console.log("areaaa2 "+s1+" "+s2);
                return e;
              } else return e;

            });
            holes = holes.filter(h => h != null)

            this.printPolygonWithHole(unionPath, sh, holes, "#000000", this.SELECTED_SHAPE_ZINDEX - 2);
          } else {
            this.printPolygon(unionPath, sh, "#000000", this.SELECTED_SHAPE_ZINDEX - 2);
          }

        });


        let printOriginShadow = false;
        if (printOriginShadow) {
          this.printPolygon(calculator.rawShadowTopPath, sh, "#ff00ff", this.SELECTED_SHAPE_ZINDEX - 1);
        }
      }
    }
  }
  private isInOriginalShadow(arr: {x: number, y: number}[], calculator: ShadowShapeCalculator) {
    return arr.every(p=> {
      for (let j = 0; j < calculator.rawShadowBlockPathsArr.length; j++) {
        const polygonInPoints = calculator.toNotPerturbatedPoint(calculator.rawShadowBlockPathsArr[j])
        if (calculator.inside(p, polygonInPoints)) {
          return true;
        }
      }
      const polygonInPoints = calculator.toNotPerturbatedPoint(calculator.rawBasePath)
      if (calculator.inside(p, polygonInPoints)) {
        return true;
      }
      const polygonInPoints2 = calculator.toNotPerturbatedPoint(calculator.rawShadowTopPath)
      if (calculator.inside(p, polygonInPoints2)) {
        return true;
      }
      return false;
    })
  }


  private displayProblematicParts(calculator: ShadowShapeCalculator, u, mergeIndex: number, sh, points: TransformablePoint[]) {
    const u1 = calculator.toLatLang(u, 0.0002 + mergeIndex / 9000, 0);
    const p1 = this.printPolygon(u1, sh, "#2bd0ff");
    sh.shadowShapes.push(p1);
    const u2 = calculator.toLatLang(points, 0.0002 + mergeIndex / 9000, 0);
    this.printPolygon(u2, sh, "#ffe426");
  }

  private makeDiffAndRemoveIfEmpty(finalShadows: Set<any>, rawBasePathPerturbated: TransformablePoint[], calculator: ShadowShapeCalculator, sh: ShadowShape) {
    const toRemove = new Set();
    const toAdd = new Set();
    let mergeIndex = 0;
    finalShadows.forEach(p => {

      const uu1 = greinerHormann.diff(p, rawBasePathPerturbated);
      console.log("remove uuuuu", uu1.length);

      const latLang1 = calculator.toLatLang(p, 0.0002 + mergeIndex++ / 9000, 0.0003);
      const p1 = this.printPolygon(latLang1, sh, "#ff390d");
      sh.shadowShapes.push(p1);
      let s1 = google.maps.geometry.spherical.computeArea(latLang1);

      uu1.forEach(u1 => {
        calculator.reverseToNotPerturbatedPoints(u1, rawBasePathPerturbated, calculator.toNotPerturbatedPoint(calculator.rawBasePath));
        calculator.cleanupAfterDegeneracies(u1);
        if (u1.length > 0) {
          //toAdd.add(u1);


          const u2 = calculator.toLatLang(u1, 0.0002 + mergeIndex++ / 9000, 0.0003);
          this.printPolygon(u2, sh,"#16ff11");

          let s2 = google.maps.geometry.spherical.computeArea(u2);
          console.log("ssss "+s2+"  "+s1+" "+Math.abs(s1-s2));
          // jesli kazdy z punktow jest na obszarze pierwotnych cieni to mozna by nie dodawac??? a co jesli przechodzi
          const inOriginal = this.isInOriginalShadow(u1, calculator);
          if (!inOriginal && ((s2<s1 && Math.abs(s1-s2)>0.00003) || uu1.length==1)) {


            console.log("ADDED "+inOriginal);
            toAdd.add(u1);
          }

        }
      });


      toRemove.add(p);

    });
    toRemove.forEach(r => finalShadows.delete(r));
    toAdd.forEach(r => finalShadows.add(r));
  }

  private makeDiff(finalShadows: Set<any>, rawBasePathPerturbated: TransformablePoint[], calculator: ShadowShapeCalculator) {
    const toRemove = new Set();
    const toAdd = new Set();
    let mergeIndex = 0;
    finalShadows.forEach(p => {

      const uu1 = greinerHormann.diff(p, rawBasePathPerturbated);
      uu1.forEach(u1 => {
        calculator.reverseToNotPerturbatedPoints(u1, rawBasePathPerturbated, calculator.toNotPerturbatedPoint(calculator.rawBasePath));
        calculator.cleanupAfterDegeneracies(u1);
        if (u1.length > 0) {
          toRemove.add(p);
          toAdd.add(u1);
        }
      })
    });
    toRemove.forEach(r => finalShadows.delete(r));
    toAdd.forEach(r => finalShadows.add(r));
  }

  private makeUnions(finalShadows: Set<any>, calculator: ShadowShapeCalculator, sh: any) {
    finalShadows.forEach((sh1, index1) => {
      const current = calculator.perturbateArray(sh1);


      let mergedCo = 0;
      const toRemove = new Set();
      const toAdd = new Set();
      let mergeIndex = 0;
      finalShadows.forEach((sh2, index2) => {
        if (sh1 !== sh2) {
          const union = greinerHormann.union(current, sh2);
          if (union.length == 1) {
            calculator.cleanupAfterDegeneracies(union[0]);
            if (union[0].length > 1 && mergedCo == 0) {
              mergedCo++;
              toRemove.add(sh1);
              toRemove.add(sh2);
              toAdd.add(union[0]);


              mergeIndex++;
              const u1 = calculator.toLatLang(sh1, 0.0001 + mergeIndex / 10000, -0.00019);
              this.printPolygon(u1, sh, "#2bd0ff");


              const u2 = calculator.toLatLang(sh2, 0.0001 + mergeIndex / 10000, 0);
              this.printPolygon(u2, sh, "#43ffdd");

              const u3 = calculator.toLatLang(union[0], 0.0001 + mergeIndex / 10000, +0.00019);
              this.printPolygon(u3, sh, "#ff994b");

            }
          }
        }
      });

      toRemove.forEach(r => finalShadows.delete(r));
      toAdd.forEach(r => finalShadows.add(r));
      console.log("toAdd " + toAdd.size);


    });
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

  private static clearShadowShapes(sh) {
    if (sh.shadowShapes != null) {
      sh.shadowShapes.forEach(shape => shape.setMap(null))
    }
    sh.shadowShapes = [];
  }

  private printPolygon(pp: google.maps.LatLng[], sh: ShadowShape, fillColor = "#ff0ff0", zIndex = this.SELECTED_SHAPE_ZINDEX) {
    const shapePolygonTotal = new Polygon();
    shapePolygonTotal.setPath(pp);
    shapePolygonTotal.setMap(this.map);
    shapePolygonTotal.setOptions({
      fillColor,
      // fillOpacity: 0.5,
      // strokeWeight: 0,
      zIndex
    });
    sh.shadowShapes.push(shapePolygonTotal);
    return shapePolygonTotal;
  }

  private printPolygonWithHole(pp: google.maps.LatLng[], sh: ShadowShape, pp2: google.maps.LatLng[][], fillColor = "#ff0ff0", zIndex = this.SELECTED_SHAPE_ZINDEX) {
    const shapePolygonTotal = new Polygon();
    shapePolygonTotal.setPaths([pp, ...pp2]);
    shapePolygonTotal.setMap(this.map);
    shapePolygonTotal.setOptions({
      fillColor,
      // fillOpacity: 0.5,
      // strokeWeight: 0,
      zIndex
    });
    sh.shadowShapes.push(shapePolygonTotal);
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
