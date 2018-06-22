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

      if (sunAltitudeRad <= 0) {
        // there is already night
        return;
      }
      const calculator = new ShadowShapeCalculator(sh, this.map, sunAltitudeRad, sunAzimuthRad);

      let mergedShadow = calculator.toNotPerturbatedPoint(calculator.rawBasePath);
      const probablyHoles = new Set();
      let mergeIndex = 0;
      for (let j = 0; j < calculator.rawShadowBlockPathsArr.length; j++) {
        const points = calculator.toPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]);
        const uu = greinerHormann.union(mergedShadow, points);
        if (uu.length > 1) {
          console.log("ERROR2, union failed:" + uu.length + " for index " + j + " ");
         // this.displayPartsProblematicToMerge(calculator, mergedShadow, ++mergeIndex, sh, points);

          // union is the biggest part, other are holes
          let indexOfMaxArea = calculator.findIndexOfMaxArea(uu);
          uu.forEach((ua, index) => {
            if (index == indexOfMaxArea) {
              mergedShadow = ua;
            } else {
              probablyHoles.add(ua);
              calculator.reverseToNotPerturbatedPoints(ua, points, calculator.toNotPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]));
            }

            /*if (index != indexOfMaxArea) {
              // display parts after problematic union
              const uarescaled = calculator.rescaleArray(ua, 1);
              const u3 = calculator.toLatLang(uarescaled, 0.0002 + mergeIndex++ / 9000, 0.00015);
              this.printPolygon(u3, sh, (index == indexOfMaxArea) ? "#00ffee"
                : "#0025c3");
            }*/
          });
        } else {
          mergedShadow = uu[0];
          // calculator.cleanupAfterDegeneracies(mergedShadow);
        }
        calculator.reverseToNotPerturbatedPoints(mergedShadow, points, calculator.toNotPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]));


       // const u3 = calculator.toLatLang(mergedShadow, 0.0002 + mergeIndex++ / 3000, 0.000);
       // this.printPolygon(u3, sh, "#ff0100");
      }


      this.makeDiffAndRemoveIfEmpty(probablyHoles, calculator, sh);





      let problematicToRemoveArrLatLang = [];
      probablyHoles.forEach(p => {
        problematicToRemoveArrLatLang.push([...calculator.toLatLang(p, 0)].reverse());
      });
      problematicToRemoveArrLatLang.push([...calculator.rawBasePath].reverse());
      // problematicToRemoveArrLatLang = [];


      const unionPath = calculator.toLatLang(mergedShadow, 0);

      if (problematicToRemoveArrLatLang.length > 0) {
        const s1 = google.maps.geometry.spherical.computeSignedArea(unionPath);

        let holes = problematicToRemoveArrLatLang.map(e => {

          let s2 = google.maps.geometry.spherical.computeSignedArea(e);

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


    }
  }


  private displayPartsProblematicToMerge(calculator: ShadowShapeCalculator, u, mergeIndex: number, sh, points: TransformablePoint[]) {
    const urescaled = calculator.rescaleArray(u, 1);
    const u1 = calculator.toLatLang(urescaled, 0.0003 + mergeIndex / 9000, 0);
    const p1 = this.printPolygon(u1, sh, "#2bd0ff");
    sh.shadows.push(p1);
    const pointsrescaled = calculator.rescaleArray(points, 1);
    const u2 = calculator.toLatLang(pointsrescaled, 0.0003 + mergeIndex / 9000, 0);
    this.printPolygon(u2, sh, "#ffe426");
  }

  private makeDiffAndRemoveIfEmpty(probablyHoles: Set<any>,  calculator: ShadowShapeCalculator, sh: ShadowShape) {


    const shadowPoints1 = calculator.toNotPerturbatedPoint(calculator.rawShadowTopPath);
    const shadowPoints2 = calculator.toPerturbatedPoint2(calculator.rawShadowTopPath);

   // const inters = greinerHormann.intersection(shadowPoints1, shadowPoints2);



    const rawBasePathPerturbated = calculator.toPerturbatedPoint2(calculator.rawBasePath);
    const toRemove = new Set();
    const toAdd = new Set();
    let mergeIndex = 0;
    let previous = probablyHoles.size

    const tempa = [...calculator.rawShadowBlockPathsArr]//, calculator.rawShadowTopPath]

    for (let shadowBlock of tempa) {

      probablyHoles.forEach(probablyHole => {
        // przy 1 nie usuwalo
        const shadowPoints = calculator.toPerturbatedPoint2(shadowBlock);
        let inters = greinerHormann.intersection(probablyHole, shadowPoints);
     /*  if (calculator.polygonInside(probablyHole, calculator.toNotPerturbatedPoint(shadowBlock))) {
          // hole is inside shadow
         inters = null;
         toRemove.add(probablyHole);

/!*         const latLang1 = calculator.toLatLang(probablyHole, 0.0003 + mergeIndex / 9000, 0); //-0.00015
         this.printPolygon(latLang1, sh, "#ff9b00");

         const latLang2 = calculator.toLatLang(shadowPoints, 0.0003 + mergeIndex++ / 9000, 0);
         this.printPolygon(latLang2, sh, "#4f0600");*!/
        }
*/
        if (inters!=null && inters.length>0 && inters[0].length>0) {

          const uu = greinerHormann.diff(probablyHole, shadowPoints);
          uu.forEach(u1 => {

            let same = false;
            if (calculator.equals(u1, shadowPoints)) {
              same = true;
              console.log("SAMEEEEEEEE");
            }
            calculator.reverseToNotPerturbatedPoints(u1, rawBasePathPerturbated, calculator.toNotPerturbatedPoint(calculator.rawBasePath));
            calculator.reverseToNotPerturbatedPoints(u1, shadowPoints, calculator.toNotPerturbatedPoint(shadowBlock));
            calculator.cleanupAfterDegeneracies(u1);


            const showShadows = true;
            if (showShadows) {
              const ratio = 1;
              const eff = 9000;
              {
               // const prescaled = calculator.rescaleArray(probablyHole, ratio);
                const latLang1 = calculator.toLatLang(probablyHole, 0.0003 + mergeIndex / eff, -0.00015);
                this.printPolygon(latLang1, sh, "#59ff00");
              }

              {
               // const prescaled = calculator.rescaleArray(shadowPoints, ratio);
                const latLang1 = calculator.toLatLang(shadowPoints, 0.0003 + mergeIndex / eff, -0.00015);
                this.printPolygon(latLang1, sh, "#ff0002");
              }

              {
                //const prescaled = calculator.rescaleArray(u1, ratio);
                const latLang1 = calculator.toLatLang(u1, 0.0003 + mergeIndex / eff, +0.00005);

                let color="#9517ff";
                if (calculator.polygonInside(probablyHole, shadowPoints))
                  color="#ff10e7"
                this.printPolygon(latLang1, sh, color);//"#9517ff");
              }
            }
            mergeIndex++;
            if (u1.length > 0 && !same) {

              toAdd.add(u1);
              toRemove.add(probablyHole);
            } else {
              toRemove.add(probablyHole);
            }
          });
          mergeIndex++;
          mergeIndex++;
        }
      });
      toRemove.forEach(r => probablyHoles.delete(r));
      toAdd.forEach(r => probablyHoles.add(r));
      toAdd.clear();
      toRemove.clear();
    }
    console.log("probably holes size "+previous+" -> "+probablyHoles.size);
    // now remove shadows
    toRemove.clear();
    toAdd.clear();



    probablyHoles.forEach(p => {

      const uu1 = greinerHormann.diff(p, rawBasePathPerturbated);
      // console.log("remove uuuuu", uu1.length);

      const prescaled = calculator.rescaleArray(p, 0.5);
      const latLang1 = calculator.toLatLang(prescaled, 0.0002 + mergeIndex++ / 9000, 0.0002);
      //const p1 = this.printPolygon(latLang1, sh, "#ff390d");
      let s1 = google.maps.geometry.spherical.computeArea(latLang1);

      uu1.forEach(u1 => {
        calculator.reverseToNotPerturbatedPoints(u1, rawBasePathPerturbated, calculator.toNotPerturbatedPoint(calculator.rawBasePath));
        calculator.cleanupAfterDegeneracies(u1);
        if (u1.length > 0) {

         const u1rescaled = calculator.rescaleArray(u1, 0.5);
          const u2 = calculator.toLatLang(u1rescaled, 0.0002 + mergeIndex++ / 9000, 0.0002);
        //  this.printPolygon(u2, sh, "#16ff11");

          let s2 = google.maps.geometry.spherical.computeArea(u2);

          // jesli kazdy z punktow jest na obszarze pierwotnych cieni to mozna by nie dodawac??? a co jesli przechodzi
          const inOriginal = calculator.isInOriginalShadow(u1, calculator);
          const inOriginal2 = calculator.isInOriginalShadow(calculator.rescaleArray(u1, 0.0009), calculator);

          //console.log("ssss " + s2 + "  " + s1 + " " + Math.abs(s1 - s2) + " isInOriginalShadow " + inOriginal + " " + inOriginal2);

          if ((!inOriginal || !inOriginal2) && ((s2 < s1 && Math.abs(s1 - s2) > 0.00003) || uu1.length == 1)) {
           // console.log("ADDED " + inOriginal);
            toAdd.add(u1);
          }

        }
      });


      toRemove.add(p);

    });
    toRemove.forEach(r => probablyHoles.delete(r));
    toAdd.forEach(r => probablyHoles.add(r));



    let printOriginShadow = false;
    if (printOriginShadow) {

      for (let pp of calculator.rawShadowBlockPathsArr) {
        this.printPolygon(pp, sh, "#11ff0d", this.SELECTED_SHAPE_ZINDEX - 2);
      }
      this.printPolygon(calculator.rawShadowTopPath, sh, "#ff00ff", this.SELECTED_SHAPE_ZINDEX - 1);
    }

  }


  private static clearShadowShapes(sh) {
    if (sh.shadows != null) {
      sh.shadows.forEach(shape => shape.setMap(null))
    }
    sh.shadows = [];
  }

  private printPolygon(pp: google.maps.LatLng[], sh: ShadowShape, fillColor: string , zIndex = this.SELECTED_SHAPE_ZINDEX) {
    const shapePolygonTotal = new Polygon();
    shapePolygonTotal.setPath(pp);
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

  private printPolygonWithHole(pp: google.maps.LatLng[], sh: ShadowShape, pp2: google.maps.LatLng[][], fillColor: string , zIndex = this.SELECTED_SHAPE_ZINDEX) {
    const shapePolygonTotal = new Polygon();
    shapePolygonTotal.setPaths([pp, ...pp2]);
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
      this.setSelection(shape);
    });
    google.maps.event.addListener(shape, 'dragend', () => {
      this.markersSet.createMarkers(shape);
      shadowService.recalculateShadows();
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
      const p = new Polygon();
      p.setPath(a.coords.map(c => new LatLng(c.lat, c.lng)));
      p.setMap(this.map);
      this.onShapeAdded(p, _ngZone, shadowService, a.heights);
    }
  }
}
