import PolygonOptions = google.maps.PolygonOptions;

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
  private currentShape: ShadowShape;

  constructor(map: google.maps.Map) {
    this.map = map;
    this.markersSet = new MarkersSet(this.map);
  }

  public onShapeAdded(shape: google.maps.Polygon | google.maps.Polyline) {
    const newShadowShape: ShadowShape = {
      shape: shape,
      heights: []
    };
    for (let i = 0; i < shape.getPath().getLength(); i++) {
      newShadowShape.heights.push(10)
    }
    this.shadowShapes.push(newShadowShape);
    this.currentShape = newShadowShape;
    this.initListeners(shape);
  }

  private clearSelection() {
    if (this.currentShape) {
      this.currentShape.shape.setEditable(false);
      this.currentShape = null;
    }
  }

  private setSelection(shape) {
    this.clearSelection();
    const shadowShape = this.shadowShapes.find((s) => s.shape === shape);
    this.currentShape = shadowShape
    shape.setEditable(true);
    var options: PolygonOptions = {
      fillColor: "#fffff0"
    };
    shape.setOptions(options)
  }

  private initListeners(shape: google.maps.Polygon | google.maps.Polyline) {
    const markersSet = this.markersSet;
    google.maps.event.addListener(shape.getPath(), 'remove_at', function () {
      markersSet.createMarkers(shape);
    });

    google.maps.event.addListener(shape.getPath(), 'set_at', function () {
      markersSet.createMarkers(shape);
    });

    google.maps.event.addListener(shape.getPath(), 'insert_at', function () {
      markersSet.createMarkers(shape);
    });

    google.maps.event.addListener(shape, 'click', function () {
      markersSet.createMarkers(shape);
      this.setSelection(shape);

    });

    google.maps.event.addListener(shape, 'dragstart', function () {
      markersSet.createMarkers(shape);

    });
    google.maps.event.addListener(shape, 'dragend', function () {
      markersSet.createMarkers(shape);

    });

    google.maps.event.addListener(shape, 'rightclick', function () {
      shape.setEditable(true);
      var options: PolygonOptions = {
        fillColor: "#ff0000"
      };
      //shape.setOptions(options)
    });
  }
}
