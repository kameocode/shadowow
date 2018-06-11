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


          let firstPoint: LatLng = polygon.getPath().getAt(0);
          const normalizedFirstPoint = this.map.getProjection().fromLatLngToPoint(firstPoint);

          for (let i = 0; i < polygon.getPath().getLength(); i++) {

            const shadowLength = sh.heights[i] / Math.tan(sunAltitudeRad);
            const point: LatLng = polygon.getPath().getAt(i);
            const shadowPoint = google.maps.geometry.spherical.computeOffset(point, shadowLength, sunAzimuthRad * 180 / Math.PI);
            pathShadowTop.push(shadowPoint);


            const rotatedPo = this.rotateTowardsSun(point, normalizedFirstPoint, sunAzimuthRad);
            pointsRotatedTowardsSun.push(rotatedPo);
            const normalizedLatLng = this.map.getProjection().fromPointToLatLng(new Point(rotatedPo.x, rotatedPo.y));
            pathRotatedTowardsSun.push(normalizedLatLng);

          }
          let pathShadowTotal = this.createShadowPathTotal(sunAzimuthRad, pointsRotatedTowardsSun, pathShadowTop, polygon);
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

          polygon.setMap(this.map);

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

          /*const shapePolygon2 = new Polygon();
          shapePolygon2.setPath(pathRotatedTowardsSun);
          shapePolygon2.setMap(this.map);
          const options2: PolygonOptions = {
            fillColor: "#0faff0",
            zIndex: this.SELECTED_SHAPE_ZINDEX +1
          };
          shapePolygon2.setOptions(options2);
          sh.shadowShapes.push(shapePolygon2);*/


        }
    }
  }

  private rotateTowardsSun(point: google.maps.LatLng, normalizedFirstPoint: google.maps.Point, sunAzimuthRad: number) {
    const normalizedPoint = this.map.getProjection().fromLatLngToPoint(point);
    const transformablePoint = TransformablePoint.of(normalizedPoint).movePo(-normalizedFirstPoint.x, -normalizedFirstPoint.y);
    let rotatedPo = transformablePoint.rotatePo(-sunAzimuthRad);
    rotatedPo = rotatedPo.movePo(normalizedFirstPoint.x, +normalizedFirstPoint.y);
    return rotatedPo;
  }

  private createShadowPathTotal(sunAzimuthRad: number, pointsRotatedTowardsSun: TransformablePoint[], pathShadowTop: google.maps.LatLng[], polygon) {
    console.log("azimuth degrees: " + (sunAzimuthRad * 180 / Math.PI));
    const minMaxIndices = findMinMax(pointsRotatedTowardsSun, "pointsRotatedTowardsSun");

    let maxLatIndex = 0;
    let minLatIndex = 0;
    let pathShadowTotal = [];

    minLatIndex = minMaxIndices.minLatIndex;
    maxLatIndex = minMaxIndices.maxLatIndex;
    // dawn
    if (minLatIndex < maxLatIndex) {
      for (let i = minLatIndex; i <= maxLatIndex; i++) {
        pathShadowTotal.push(pathShadowTop[i]);
        //console.log("iiA " + i + "minLatIndex " + minLatIndex + ", maxLatIndex " + maxLatIndex);
      }
      for (let i = maxLatIndex; i >= minLatIndex; i--) {
        pathShadowTotal.push(polygon.getPath().getAt(i));
        //console.log("jjA " + i);
      }


    } else {
      // dusk
      for (let i = maxLatIndex; i <= minLatIndex; i++) {
        pathShadowTotal.push(pathShadowTop[i]);
        //console.log("iiB " + i + "minLatIndex " + minLatIndex + ", maxLatIndex " + maxLatIndex);
      }
      for (let i = minLatIndex; i >= maxLatIndex; i--) {
        pathShadowTotal.push(polygon.getPath().getAt(i));
        //console.log("jjB " + i);
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
      newShadowShape.heights.push(10);
    }

    this.shadowShapes.push(newShadowShape);
    this.currentShape = newShadowShape;
    this.initListeners(shape, _ngZone, shadowService);
  }

  private clearSelection() {
    if (this.currentShape) {
      this.currentShape.shape.setEditable(false);
      this.currentShape = null;
    }
  }

  private setSelection(shape) {
    this.clearSelection();
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
      console.log("insert ", vertex);
      const shadowShape = this.shadowShapes.find((s) => s.shape === shape);
      console.log("heights", shadowShape.heights);
      shadowShape.heights.splice(vertex, 0, 10);
      console.log("heightsB", shadowShape.heights)
      shadowService.recalculateShadows();
    });

    google.maps.event.addListener(shape, 'rightclick', (e) => {
      // Check if click was on a vertex control point
      console.log("remove", e.vertex);
      if (e.vertex == undefined) {
        return;
      }
      shape.getPath().removeAt(e.vertex);
      const shadowShape = this.shadowShapes.find((s) => s.shape === shape);
      shadowShape.heights.splice(e.vertex, 1);
      // TODO if last vertex, remove whole shadowShape
    });

    google.maps.event.addListener(shape, 'click', () => {
      this.markersSet.createMarkers(shape);

      _ngZone.run(() => {
        this.setSelection(shape);
      })

    });

    google.maps.event.addListener(shape, 'dragstart', () => {
      this.markersSet.createMarkers(shape);

    });
    google.maps.event.addListener(shape, 'dragend', () => {
      this.markersSet.createMarkers(shape);
      shadowService.recalculateShadows();

    });

    google.maps.event.addListener(shape, 'rightclick', () => {
      shape.setEditable(true);

    });

    this.markersSet.createMarkers(shape);
    _ngZone.run(() => {
      this.setSelection(shape);
    })
    shadowService.recalculateShadows();
  }
}
