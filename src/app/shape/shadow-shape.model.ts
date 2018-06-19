import {colors, MarkersSet} from "./marker-set.model";
import {NgZone} from "@angular/core";
import {findMinMax, TransformablePoint} from "./tranformable-point.model";
import {ShadowCalculatorService} from "../shadow-calculator.service";
import * as _ from "lodash";
import LatLng = google.maps.LatLng;
import Point = google.maps.Point;
import Polygon = google.maps.Polygon;
import PolygonOptions = google.maps.PolygonOptions;

const greinerHormann = require('greiner-hormann');

export interface ShadowShape {
  shape: google.maps.Polygon
  shadowShapes?: google.maps.Polygon[]
  heights: number[]
}

class ShadowShapeCalculator {
  r = 0.0000000001; //0.000000000001;
  diff: number;
  shadowBlockPointsArr: { x: number, y: number }[][] = [];
  rawShadowBlockPathsArr: LatLng[][] = [];
  rawShadowTopPath: LatLng[] = [];
  rawBasePath: LatLng[] = [];

  constructor(private map: google.maps.Map, private sunAltitudeRad: number, private sunAzimuthRad: number) {
    this.diff = this.r * 2;
  }

  perturbate() {

    const n = Math.random() * this.r;
    if (n > this.r || n < -this.r) {
      throw Error("Wrong n " + n);
    }

    return n;
  }

  public addShadowBlockPath(u: LatLng[],) {
    this.rawShadowBlockPathsArr.push(u);
    const points = this.toPerturbatedPoint(u);
    this.shadowBlockPointsArr.push(points);
  }
  addBasePoint(point: google.maps.LatLng) {
    this.rawBasePath.push(point);
  }
  addShadowTopPoint(point: google.maps.LatLng) {
    this.rawShadowTopPath.push(point);
  }


  public toPerturbatedPoint(u: google.maps.LatLng[]) {
    const points = u.map(latLng => {
      const p = this.map.getProjection().fromLatLngToPoint(latLng);
      return new TransformablePoint(p.x, p.y).rotatePo(-this.sunAzimuthRad).movePo(this.perturbate(), this.perturbate());
    });
    return points;
  }

  public removeTooClosedPoints(u: { x: number, y: number }[]) {
    // remove points with too little distances
    for (let i = u.length - 1; i >= 0; i--) {
      const u1 = u[i];
      for (let j = i - 1; j >= 0; j--) {
        const u2 = u[j];
        const tooClose = Math.abs(u1.x - u2.x) + Math.abs(u1.y - u2.y) < this.diff;
        // console.log("DIFF "+i+" "+j+" "+ ((Math.abs(u1.x-u2.x)+Math.abs(u1.y-u2.y))));
        if (tooClose) {
          const p = new TransformablePoint(u1.x, u1.y).rotatePo(+this.sunAzimuthRad);
          //if (j==i-1) {
          //this.shadowMarkersSet.addMarker(this.map.getProjection().fromPointToLatLng(new Point(p.x + 0.0002, p.y)), "M" + i);
          //}
          u.splice(j, 1);
          i--;
        } else
          break;
      }
    }
    const tooClose = Math.abs(u[0].x - u[u.length - 1].x) + Math.abs(u[0].y - u[u.length - 1].y) < this.diff;
    if (tooClose)
      u.splice(u.length - 1, 1);
  }

  public removeTooSmallAngles(u: { x: number, y: number }[]) {
    for (let i = 1; i <= u.length; i += 1) {
      const a = u[i - 1];
      const b = u[i % u.length];
      const c = u[(i + 1) % u.length];

      const vector1 = new Point(b.x - a.x, b.y - a.y);
      const vector2 = new Point(b.x - c.x, b.y - c.y);

      var angleDeg = (Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x)) * 180 / Math.PI;//Math.atan2(vector2.y - vector1.y, vector2.x - vector1.x) * 180 / Math.PI;
      if (Math.abs(angleDeg) < 0.01) {
        // remove point b&c
        // u.splice((i+1) % u.length, 1);
        u.splice(i % u.length, 1);
      }
      const p = new TransformablePoint(b.x, b.y).rotatePo(this.sunAzimuthRad);
      //this.shadowMarkersSet.addMarker(this.map.getProjection().fromPointToLatLng(new Point(p.x + 0.0002, p.y)),"M"+(i % u.length));
    }
  }


  toLatLang(numbers: { x: number, y: number }[], xoffset = 0) {
    return numbers.map(p => {
      p = new TransformablePoint(p.x, p.y).rotatePo(+this.sunAzimuthRad);
      return this.map.getProjection().fromPointToLatLng(new Point(p.x + xoffset, p.y));
    });
  }


  calculateShadowPoint(sh: ShadowShape, i: number) {
    const point: LatLng = sh.shape.getPath().getAt(i);
    const shadowLength = sh.heights[i] / Math.tan(this.sunAltitudeRad);
    return google.maps.geometry.spherical.computeOffset(point, shadowLength, this.sunAzimuthRad * 180 / Math.PI);
  }


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
        const pointsRotatedTowardsSun: TransformablePoint[] = [];


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

          {
            const rotatedPo = this.rotateTowardsSun(point, polygon, sunAzimuthRad);
            pointsRotatedTowardsSun.push(rotatedPo);
            // pathRotatedTowardsSun.push(this.map.getProjection().fromPointToLatLng(new Point(rotatedPo.x, rotatedPo.y)));
            // const rotatedPoShadow = this.rotateTowardsSun(shadowPoint, polygon, sunAzimuthRad);
            //pointsShadowRotatedTowardsSun.push(rotatedPoShadow)
          }
        }

        let pathShadowTotal: LatLng[] = ShadowShapeSet.createShadowPathTotal(sunAzimuthRad, pointsRotatedTowardsSun, calculator.rawShadowTopPath, polygon);
        let pointsShadowTotal = pathShadowTotal.map(m => {
          const p = this.map.getProjection().fromLatLngToPoint(m);
          return new TransformablePoint(p.x, p.y).rotatePo(-sunAzimuthRad);//.movePo(0, 0.00000000009);
        });


        let uu;
        let u;
        let counter=0;
        let maxCounter = 100;
        do {
          uu = greinerHormann.union(calculator.toPerturbatedPoint(calculator.rawShadowTopPath), pointsShadowTotal);
          if (uu.length == 1) {
            u = uu[0];
          } else if (uu.length > 1 && counter++<maxCounter) {
            console.log("ERROR, union failed " + uu.length);
          }
        } while (uu.length>1 );

        calculator.removeTooClosedPoints(u);
        calculator.removeTooSmallAngles(u);

        let jj = 0;
        // now add simple
        for (let j = 0; j < calculator.rawShadowBlockPathsArr.length; j++) {
          const points = calculator.toPerturbatedPoint(calculator.rawShadowBlockPathsArr[j]);
          uu = greinerHormann.union(u, points);
          if (uu.length > 1) {
            jj++;
            console.log("ERROR2, union failed " + uu.length + " for index " + j);
            if (jj < maxCounter)
              j--;
            else
              jj = 0;
          } else {
            u = uu[0];
            calculator.removeTooClosedPoints(u);
            calculator.removeTooSmallAngles(u);
          }
        }

        uu = greinerHormann.diff(u, calculator.toPerturbatedPoint(calculator.rawBasePath));
        console.log("Blocks after diff: " + uu.length);
        uu.forEach(u => {
          calculator.removeTooClosedPoints(u);
          calculator.removeTooSmallAngles(u);
          const unionPath = calculator.toLatLang(u, 0);
          const p0 = this.printPolygon(unionPath, "#000000");
          sh.shadowShapes.push(p0);
        });




        // on base of this two and calculator.shadowPointArr we calculate final shadow
        let printOriginShadow = false;


        if (printOriginShadow) {
          for (let i = 0; i < calculator.shadowBlockPointsArr.length; i++) {
            const latLangPath = calculator.toLatLang(calculator.shadowBlockPointsArr[i], 0.0005);
            const blockShadowPath = this.printPolygon(latLangPath);
            sh.shadowShapes.push(blockShadowPath);
          }


          const shapePolygonTotal = this.printPolygon(pathShadowTotal, "#00ff00", this.SELECTED_SHAPE_ZINDEX - 2);
          sh.shadowShapes.push(shapePolygonTotal);
          const shapePolygon = this.printPolygon(calculator.rawShadowTopPath, "#ff00ff", this.SELECTED_SHAPE_ZINDEX - 1);
          sh.shadowShapes.push(shapePolygon);
        }
        // const shapePolygon2 = this.printPolygon(pathRotatedTowardsSun, "#0faff0", this.SELECTED_SHAPE_ZINDEX + 1);
        // sh.shadowShapes.push(shapePolygon2);
      }
    }
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

  private rotateTowardsSun(point: google.maps.LatLng, polygon: Polygon, sunAzimuthRad: number) {
    let firstPoint: LatLng = polygon.getPath().getAt(0);
    const normalizedFirstPoint = this.map.getProjection().fromLatLngToPoint(firstPoint);
    const normalizedPoint = this.map.getProjection().fromLatLngToPoint(point);
    const transformablePoint = TransformablePoint.of(normalizedPoint).movePo(-normalizedFirstPoint.x, -normalizedFirstPoint.y);
    let rotatedPo = transformablePoint.rotatePo(-sunAzimuthRad);
    rotatedPo = rotatedPo.movePo(normalizedFirstPoint.x, +normalizedFirstPoint.y);
    return rotatedPo;
  }

  private static createShadowPathTotal(sunAzimuthRad: number, pointsRotatedTowardsSun: TransformablePoint[], pathShadowTop: google.maps.LatLng[], polygon) {
    const minMaxIndices = findMinMax(pointsRotatedTowardsSun, "pointsRotatedTowardsSun");
    let pathShadowTotal: LatLng[] = [];
    if (minMaxIndices.minLngIndexSlope) {
      for (let i = minMaxIndices.startLatIndex; i <= minMaxIndices.endLatIndex; i++) {
        pathShadowTotal.push(polygon.getPath().getAt(i));
      }
      for (let i = minMaxIndices.endLatIndex; i >= minMaxIndices.startLatIndex; i--) {
        pathShadowTotal.push(pathShadowTop[i]);
      }
    } else {
      for (let i = minMaxIndices.endLatIndex; i < pathShadowTop.length; i++) {
        pathShadowTotal.push(pathShadowTop[i]);
      }
      for (let i = 0; i <= minMaxIndices.startLatIndex; i++) {
        pathShadowTotal.push(pathShadowTop[i]);
      }
      for (let i = minMaxIndices.startLatIndex; i >= 0; i--) {
        pathShadowTotal.push(polygon.getPath().getAt(i));
      }
      for (let i = pathShadowTop.length - 1; i >= minMaxIndices.endLatIndex; i--) {
        pathShadowTotal.push(polygon.getPath().getAt(i));
      }
    }
    return pathShadowTotal;
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
