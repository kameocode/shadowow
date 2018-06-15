import {colors, MarkersSet} from "./marker-set.model";
import {NgZone} from "@angular/core";
import {findMinMax, TransformablePoint} from "./tranformable-point.model";
import {ShadowCalculatorService} from "../shadow-calculator.service";
import LatLng = google.maps.LatLng;
import Point = google.maps.Point;
import Polygon = google.maps.Polygon;
import PolygonOptions = google.maps.PolygonOptions;


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

  constructor(map: google.maps.Map) {
    this.map = map;
    this.markersSet = new MarkersSet(this.map);
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
        const pathRotatedTowardsSun: LatLng[] = [];

        for (let i = 0; i < polygon.getPath().getLength(); i++) {
          const shadowLength = sh.heights[i] / Math.tan(sunAltitudeRad);
          const point: LatLng = polygon.getPath().getAt(i);
          const shadowPoint = google.maps.geometry.spherical.computeOffset(point, shadowLength, sunAzimuthRad * 180 / Math.PI);
          pathShadowTop.push(shadowPoint);

          const rotatedPo = this.rotateTowardsSun(point, polygon, sunAzimuthRad);
          pointsRotatedTowardsSun.push(rotatedPo);
          const normalizedLatLng = this.map.getProjection().fromPointToLatLng(new Point(rotatedPo.x, rotatedPo.y));
          pathRotatedTowardsSun.push(normalizedLatLng);
        }

        const pathShadowTotal = ShadowShapeSet.createShadowPathTotal(sunAzimuthRad, pointsRotatedTowardsSun, pathShadowTop, polygon);
        const shapePolygonTotal = new Polygon();
        shapePolygonTotal.setPath(pathShadowTotal);
        shapePolygonTotal.setMap(this.map);
        shapePolygonTotal.setOptions({
          fillColor: "#000000",
          // fillOpacity: 0.5,
          // strokeWeight: 0,
          zIndex: this.SELECTED_SHAPE_ZINDEX - 2
        });
        sh.shadowShapes.push(shapePolygonTotal);

        /*
                const shapePolygon = new Polygon();
                shapePolygon.setPath(pathShadowTop);
                shapePolygon.setMap(this.map);
                const options: PolygonOptions = {
                  fillColor: "#000000",
                  // fillOpacity: 0.5,
                  // strokeWeight: 0,
                  zIndex: this.SELECTED_SHAPE_ZINDEX - 1
                };
                shapePolygon.setOptions(options);
                sh.shadowShapes.push(shapePolygon);
        */
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

    let condition = minMaxIndices.minLngIndexSlope;
    console.log("maxy " + "  [" + (minMaxIndices.minLatIndex + 1) + "," + (minMaxIndices.maxLatIndex + 1) + "] " + condition + " slope: " + minMaxIndices.minLngIndexSlope);
    if (condition) {
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


    /*
         if (minMaxIndices.minLatIndex < minMaxIndices.maxLatIndex) {
          for (let i = minMaxIndices.minLatIndex; i <= minMaxIndices.maxLatIndex; i++) {
            pathShadowTotal.push(pathShadowTop[i]);
          }
          for (let i = minMaxIndices.maxLatIndex; i >= minMaxIndices.minLatIndex; i--) {
            pathShadowTotal.push(polygon.getPath().getAt(i));
          }
        } else {
          for (let i = minMaxIndices.maxLatIndex; i <= minMaxIndices.minLatIndex; i++) {
            pathShadowTotal.push(pathShadowTop[i]);
          }
          for (let i = minMaxIndices.minLatIndex; i >= minMaxIndices.maxLatIndex; i--) {
            pathShadowTotal.push(polygon.getPath().getAt(i));

          }
        }*/
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

    google.maps.event.addListener(shape.getPath(), 'set_at', () => {
        this.markersSet.createMarkers(shape);
        shadowService.recalculateShadows();
      }
    );

    google.maps.event.addListener(shape.getPath(), 'insert_at', (vertex: number) => {
      this.markersSet.createMarkers(shape);
      const shadowShape = this.shadowShapes.find((s) => s.shape === shape);
      shadowShape.heights.splice(vertex, 0, this.DEFAULT_HEIGHT);
      shadowService.recalculateShadows();
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
