import PolygonOptions = google.maps.PolygonOptions;
import {NgZone} from "@angular/core";

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
        label: '' + (i + 1)
      });
      this.currentMarkers.push(marker)
    }
  }
}

export interface ShadowShape {
  shape: google.maps.Polygon | google.maps.Polyline | google.maps.Rectangle | google.maps.Circle
  heights: number[]
}

export class ShadowShapeSet {
  private shadowShapes: ShadowShape[] = [];
  private markersSet: MarkersSet;
  private map: google.maps.Map;
  public currentShape: ShadowShape;

  constructor(map: google.maps.Map) {
    this.map = map;
    this.markersSet = new MarkersSet(this.map);
  }

  public onShapeAdded(shape: google.maps.Polygon | google.maps.Polyline, _ngZone: NgZone) {
    const newShadowShape: ShadowShape = {
      shape: shape,
      heights: [],
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
    this.currentShape =  this.shadowShapes.find((s) => s.shape === shape);
    shape.setEditable(true);
    const options: PolygonOptions = {
      fillColor: "#fffff0"
    };
    shape.setOptions(options)
  }

  private initListeners(shape: google.maps.Polygon | google.maps.Polyline, _ngZone: NgZone) {
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

    google.maps.event.addListener(shape, 'click', () =>  {
      markersSet.createMarkers(shape);

      _ngZone.run(() => {
        this.setSelection(shape);
      })

    });

    google.maps.event.addListener(shape, 'dragstart', () =>  {
      markersSet.createMarkers(shape);

    });
    google.maps.event.addListener(shape, 'dragend', () =>  {
      markersSet.createMarkers(shape);

    });

    google.maps.event.addListener(shape, 'rightclick', () =>  {
      shape.setEditable(true);
      const options: PolygonOptions = {
        fillColor: "#ff0000"
      };
      //shape.setOptions(options)
    });
  }
}
