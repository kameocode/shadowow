import PolygonOptions = google.maps.PolygonOptions;
import Polygon = google.maps.Polygon;
import LatLng = google.maps.LatLng;
import {NgZone} from "@angular/core";
import Point = google.maps.Point;


export const colors = {
  colorArea: "#fffff0" //"#a7ffeb"
};

export class MarkersSet {
  private map: google.maps.Map;
  private currentMarkers: google.maps.Marker[] = [];


  constructor(map: google.maps.Map) {
    this.map = map;
  }


  public createMarkers(newShape: google.maps.Polygon | google.maps.Polyline) {

    this.currentMarkers.forEach(marker => marker.setMap(null));
    this.currentMarkers = [];

    const path: google.maps.MVCArray<google.maps.LatLng> = newShape.getPath();
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(point.lat(), point.lng()),
        map: this.map,
        label: ''+(i + 1),
        icon: {
          labelOrigin: new google.maps.Point(15,13),
          url: 'assets/pin.svg',
          anchor: new google.maps.Point(15, 43),
        }
      });

      this.currentMarkers.push(marker)
    }
  }
}
interface Po {
  x,
  y
}
interface MinmaxIndices {
  maxLatIndex: number;
  minLatIndex: number;
  maxLngIndex:number;
  minLngIndex:number;
}
export interface ShadowShape {
  shape: google.maps.Polygon | google.maps.Polyline | google.maps.Rectangle
  shadowShapes?: google.maps.Polygon[]
  heights: number[],
  shadows: number[]
}


export class ShadowShapeSet {
  private shadowShapes: ShadowShape[] = [];
  private markersSet: MarkersSet;
  public map: google.maps.Map;
  public currentShape: ShadowShape;
  private SELECTED_SHAPE_ZINDEX = 200;

  constructor(map: google.maps.Map) {
    this.map = map;
    this.markersSet = new MarkersSet(this.map);
  }



  private movePo(point: Po, x: number, y: number): Po {
    return {x: point.x + x, y: point.y + y};
  }

  private rotatePo(point: Po, angleRad: number): Po {
    const y = point.x * Math.sin(angleRad) + point.y * Math.cos(angleRad);
    const x = point.x * Math.cos(angleRad) - point.y * Math.sin(angleRad);
    return {x, y};
  }

  private findMinMax(path: Po[], prefix = ''): MinmaxIndices {
    let maxLat = path[0];
    let maxLng = path[0];
    let minLat = path[0];
    let minLng = path[0];
    let maxLatIndex = 0;
    let minLatIndex = 0;
    let maxLngIndex = 0;
    let minLngIndex = 0;

    path.forEach((p, index) => {
      //console.log("indexB " + (index + 1) + " " + p.toString());
      if (maxLat.x < p.x) {
        maxLatIndex = index;
        maxLat = p;
      }
      if (minLat.x > p.x) {
        minLatIndex = index;
        minLat = p;
      }
      if (maxLng.y < p.y) {
        //console.log("index "+index+" compareMAX "+maxLng.lng()+" "+p.lng());
        maxLngIndex = index;
        maxLng = p;
      }
      if (minLng.y > p.y) {
        //console.log("index "+index+" compareMIN "+minLng.lng()+" "+p.lng());
        minLngIndex = index;
        minLng = p;
      }

    });

    console.log(prefix+" x: min=" + (minLatIndex + 1) + ", max=" + (maxLatIndex + 1));
    console.log(prefix+" y: min=" + (minLngIndex + 1) + ", max=" + (maxLngIndex + 1));

    return {
      maxLatIndex,
      minLatIndex,
      maxLngIndex,
      minLngIndex,
    }
  }

  public createShadows(sunAltitudeRad: number, sunAzimuthRad: number) {
    for (let sh of this.shadowShapes) {
      sh.shadows = [];
      for (let h of sh.heights) {
        const shadowLength = h / Math.tan(sunAltitudeRad);
        sh.shadows.push(shadowLength);
        const polygon = sh.shape as Polygon;

        if (sh.shadowShapes != null) {
          sh.shadowShapes.forEach(shape => {
            shape.setMap(null);
          })
        }
        sh.shadowShapes = [];
        if (sunAltitudeRad > 0) {

          const pathShadowTop: LatLng[] = [];
          const pointsRotatedTowardsSun: Po[] = [];
          const pathRotatedTowardsSun: LatLng[] = [];


          let firstPoint: LatLng = polygon.getPath().getAt(0);
          const normalizedFirstPoint = this.map.getProjection().fromLatLngToPoint(firstPoint);

          for (let i = 0; i < polygon.getPath().getLength(); i++) {
            let point: LatLng = polygon.getPath().getAt(i);
            let shadowPoint = google.maps.geometry.spherical.computeOffset(point, shadowLength, sunAzimuthRad * 180 / Math.PI);
            pathShadowTop.push(shadowPoint);



            const normalizedPoint = this.map.getProjection().fromLatLngToPoint(point);
            const Po= this.movePo({x: normalizedPoint.x, y: normalizedPoint.y}, -normalizedFirstPoint.x, -normalizedFirstPoint.y);
            let rotatedPo = this.rotatePo(Po, - sunAzimuthRad);
            rotatedPo = this.movePo( rotatedPo, normalizedFirstPoint.x, +normalizedFirstPoint.y);
            pointsRotatedTowardsSun.push(rotatedPo);
            const normalizedLatLng = this.map.getProjection().fromPointToLatLng(new Point(rotatedPo.x, rotatedPo.y));
            pathRotatedTowardsSun.push(normalizedLatLng);

          }

          console.log("azimuth degrees: "+(sunAzimuthRad * 180 / Math.PI));
          const minMaxIndices = this.findMinMax(pointsRotatedTowardsSun, "pointsRotatedTowardsSun");

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


          const shapePolygonTotal = new Polygon();
          shapePolygonTotal.setPath(pathShadowTotal);
          shapePolygonTotal.setMap(this.map);
          shapePolygonTotal.setOptions({
            fillColor: "#000000",
            zIndex: this.SELECTED_SHAPE_ZINDEX - 2
          });
          sh.shadowShapes.push(shapePolygonTotal);

          polygon.setMap(this.map);

          const shapePolygon = new Polygon();
          shapePolygon.setPath(pathShadowTop);
          shapePolygon.setMap(this.map);
          const options: PolygonOptions = {
            fillColor: "#efaff0",
            zIndex: this.SELECTED_SHAPE_ZINDEX - 1
          };
          shapePolygon.setOptions(options);
          sh.shadowShapes.push(shapePolygon);

          const shapePolygon2 = new Polygon();
          shapePolygon2.setPath(pathRotatedTowardsSun);
          shapePolygon2.setMap(this.map);
          const options2: PolygonOptions = {
            fillColor: "#0faff0",
            zIndex: this.SELECTED_SHAPE_ZINDEX +1
          };
          shapePolygon2.setOptions(options2);
          sh.shadowShapes.push(shapePolygon2);


        }

      }

    }
  }

  public onShapeAdded(shape: google.maps.Polygon, _ngZone: NgZone) {
    const newShadowShape: ShadowShape = {
      shape: shape,
      heights: [],
      shadows: []
    };


    for (let i = 0; i < shape.getPath().getLength(); i++) {
      newShadowShape.heights.push(10);
    }


    this.shadowShapes.push(newShadowShape);
    this.currentShape = newShadowShape;
    this.initListeners(shape, _ngZone);


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

  private initListeners(shape: google.maps.Polygon, _ngZone: NgZone) {
    const markersSet = this.markersSet;

    google.maps.event.addListener(shape.getPath(), 'remove_at', () => {
      markersSet.createMarkers(shape);
    });

    google.maps.event.addListener(shape.getPath(), 'set_at', function () {
      markersSet.createMarkers(shape);
    });

    google.maps.event.addListener(shape.getPath(), 'insert_at', (vertex: number) => {
      markersSet.createMarkers(shape);
      console.log("insert ", vertex);
      const shadowShape = this.shadowShapes.find((s) => s.shape === shape);
      console.log("heights", shadowShape.heights);
      shadowShape.heights.splice(vertex, 0, 10);
      console.log("heightsB", shadowShape.heights)
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
      markersSet.createMarkers(shape);

      _ngZone.run(() => {
        this.setSelection(shape);
      })

    });

    google.maps.event.addListener(shape, 'dragstart', () => {
      markersSet.createMarkers(shape);

    });
    google.maps.event.addListener(shape, 'dragend', () => {
      markersSet.createMarkers(shape);

    });

    google.maps.event.addListener(shape, 'rightclick', () => {
      shape.setEditable(true);
      const options: PolygonOptions = {
        fillColor: "#ff0000"
      };
      //shape.setOptions(options)
    });
  }
}
