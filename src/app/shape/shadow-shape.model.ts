import {colors, MarkersSet} from "./marker-set.model";
import {NgZone} from "@angular/core";
import {findMinMax, TransformablePoint} from "./tranformable-point.model";
import {ShadowCalculatorService} from "../shadow-calculator.service";
import * as _ from "lodash";
import LatLng = google.maps.LatLng;
import Point = google.maps.Point;
import Polygon = google.maps.Polygon;
import PolygonOptions = google.maps.PolygonOptions;

var greinerHormann = require('greiner-hormann');

export interface ShadowShape {
  shape: google.maps.Polygon
  shadowShapes?: google.maps.Polygon[]
  heights: number[]
}

class CalculatedPaths {


  constructor(private sunAzimuthRad: number) {

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
    for (let sh of this.shadowShapes) {
      const polygon = sh.shape;
      if (sh.shadowShapes != null) {
        sh.shadowShapes.forEach(shape => shape.setMap(null))
      }
      sh.shadowShapes = [];
      if (sunAltitudeRad > 0) {
        const pathShadowTop: LatLng[] = [];
        const pointsRotatedTowardsSun: TransformablePoint[] = [];
        // const pathRotatedTowardsSun: LatLng[] = [];


        const pointsSource: { x: number, y: number }[] = [];
        const pointsShadowTop: { x: number, y: number }[] = [];


        for (let i = 0; i < polygon.getPath().getLength(); i++) {
          const shadowLength = sh.heights[i] / Math.tan(sunAltitudeRad);
          const point: LatLng = polygon.getPath().getAt(i);
          const shadowPoint = google.maps.geometry.spherical.computeOffset(point, shadowLength, sunAzimuthRad * 180 / Math.PI);
          pathShadowTop.push(shadowPoint);

          {
            const rotatedPo = this.rotateTowardsSun(point, polygon, sunAzimuthRad);
            pointsRotatedTowardsSun.push(rotatedPo);
            // pathRotatedTowardsSun.push(this.map.getProjection().fromPointToLatLng(new Point(rotatedPo.x, rotatedPo.y)));
            // const rotatedPoShadow = this.rotateTowardsSun(shadowPoint, polygon, sunAzimuthRad);
            //pointsShadowRotatedTowardsSun.push(rotatedPoShadow)
          }



          const p1 = this.map.getProjection().fromLatLngToPoint(point);
          const p2 = this.map.getProjection().fromLatLngToPoint(shadowPoint);
          pointsSource.push(new TransformablePoint(p1.x, p1.y).rotatePo(-sunAzimuthRad).movePo(0, 0.0000000001));
          pointsShadowTop.push(new TransformablePoint(p2.x, p2.y).rotatePo(-sunAzimuthRad).movePo(0.000000001, 0.000000001));
        }
        let pathShadowTotal: LatLng[] = ShadowShapeSet.createShadowPathTotal(sunAzimuthRad, pointsRotatedTowardsSun, pathShadowTop, polygon);
        const pointsShadowTotal = pathShadowTotal.map(m => {
          const p = this.map.getProjection().fromLatLngToPoint(m);
          return new TransformablePoint(p.x, p.y).rotatePo(-sunAzimuthRad);//.movePo(0, 0.00000000009);
        });


        var union = greinerHormann.union(pointsShadowTop, pointsShadowTotal);

        this.shadowMarkersSet.clearMarkers();
        union.map(u => {
          u = greinerHormann.diff(u, pointsSource)[0];

          const tempu = [];
          for (let i = 0; i < u.length; i++) {
            const u1 = u[i];

            const tooClose = u.some(u2=>u1!==u2 &&  Math.abs(u1.x-u2.x)+Math.abs(u1.y-u2.y) <= 0.000000002);

            if (!tooClose) {
              console.log("add");
              tempu.push(u1);



            } else {
              const p = new TransformablePoint(u1.x, u1.y).rotatePo(+sunAzimuthRad);
              this.shadowMarkersSet.addMarker(this.map.getProjection().fromPointToLatLng(new Point(p.x + 0.0002, p.y)),"M");
            }

          }
         // u = tempu;

          const unionPath = u.map(p => {
            p = new TransformablePoint(p.x, p.y).rotatePo(+sunAzimuthRad);
            return this.map.getProjection().fromPointToLatLng(new Point(p.x + 0.0002, p.y));
          });


          //TODO remove all points that lay too close to each other

          const shapePolygonTotal = new Polygon();
          shapePolygonTotal.setPath(unionPath);
          shapePolygonTotal.setMap(this.map);
          shapePolygonTotal.setOptions({
            fillColor: "#00fff0",
            // fillOpacity: 0.5,
            // strokeWeight: 0,
            zIndex: this.SELECTED_SHAPE_ZINDEX
          });
          sh.shadowShapes.push(shapePolygonTotal);

        });


        const shapePolygonTotal = new Polygon();
        shapePolygonTotal.setPath(pathShadowTotal);
        shapePolygonTotal.setMap(this.map);
        shapePolygonTotal.setOptions({
          fillColor: "#00ff00",
          // fillOpacity: 0.5,
          // strokeWeight: 0,
          zIndex: this.SELECTED_SHAPE_ZINDEX - 2
        });
        sh.shadowShapes.push(shapePolygonTotal);


        /*        // offseted totatl shadow with markers
                const npo = pathShadowTotal.map(p=> {
                  // console.log("p "+p.x+", "+p.y+" "+this.map.getProjection().fromPointToLatLng(new Point(p.x, p.y)));
                  const po = this.map.getProjection().fromLatLngToPoint(p);
                  return this.map.getProjection().fromPointToLatLng(new Point(po.x+0.0001, po.y+0.0001));
                });
                const shapePolygonTotal2 = new Polygon();
                shapePolygonTotal2.setPath(npo);
                shapePolygonTotal2.setMap(this.map);
                shapePolygonTotal2.setOptions({
                  fillColor: "#ffff00",
                  // fillOpacity: 0.5,
                  // strokeWeight: 0,
                  zIndex: this.SELECTED_SHAPE_ZINDEX - 2
                });
                sh.shadowShapes.push(shapePolygonTotal2);
               this.shadowMarkersSet.createMarkers(shapePolygonTotal2);*/

        const shapePolygon = new Polygon();
        shapePolygon.setPath(pathShadowTop);
        shapePolygon.setMap(this.map);
        const options: PolygonOptions = {
          fillColor: "#ff00ff",
          // fillOpacity: 0.5,
          //strokeWeight: 1,
          // strokeColor: "#ffffff",
          zIndex: this.SELECTED_SHAPE_ZINDEX - 1
        };
        shapePolygon.setOptions(options);
        sh.shadowShapes.push(shapePolygon);

        /*
                const shapePolygon2 = new Polygon();
                shapePolygon2.setPath(pathRotatedTowardsSun);
                shapePolygon2.setMap(this.map);
                const options2: PolygonOptions = {
                  fillColor: "#0faff0",
                  zIndex: this.SELECTED_SHAPE_ZINDEX + 1
                };
                shapePolygon2.setOptions(options2);
                sh.shadowShapes.push(shapePolygon2);
        */
      }
    }
  }

  private createPolygon(sh: ShadowShape, path: LatLng[], fillColor = "#00fff0") {
    const shapePolygonTotal = new Polygon();
    shapePolygonTotal.setPath(path);
    shapePolygonTotal.setMap(this.map);
    shapePolygonTotal.setOptions({
      fillColor: fillColor,
      // fillOpacity: 0.5,
      // strokeWeight: 0,
      zIndex: this.SELECTED_SHAPE_ZINDEX
    });
    sh.shadowShapes.push(shapePolygonTotal);
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

  private clearSelection() {
    if (this.currentShape) {
      this.markersSet.clearMarkers();
      this.currentShape.shape.setEditable(false);
      this.currentShape = null;
    }
  }

  private setSelection(shape, toggle?: boolean) {
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
      shape.getPath().removeAt(e.vertex);
      const shadowShape = this.shadowShapes.find((s) => s.shape === shape);
      shadowShape.heights.splice(e.vertex, 1);
      if (shadowShape.heights.length === 0) {
        // if last vertex, remove whole shadowShape (TODO with listeners)
        const indexToDelete = this.shadowShapes.indexOf(shadowShape);
        shadowShape.shape.setMap(null);
        this.shadowShapes.splice(indexToDelete, 1);
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
