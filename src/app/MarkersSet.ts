export class MarkersSet {
  private map: google.maps.Map;
  private currentMarkers: google.maps.Marker[] = [];

  constructor(map: google.maps.Map) {
    this.map = map;
  }


  public createMarkers(newShape: google.maps.Polygon) {

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
  shape: google.maps.Marker | google.maps.Polygon | google.maps.Polyline | google.maps.Rectangle | google.maps.Circle
  heights: number[]
}
export class ShadowShapeSet {
  private shadowShapes: ShadowShape[] = [];
  private map: google.maps.Map;

  constructor(map: google.maps.Map) {
    this.map = map;
  }

  public onShapeAdded(shape: google.maps.Polygon | google.maps.Polyline ) {
    const newShadowShape: ShadowShape = {
      shape: shape,
      heights: []
    };
    for (let i = 0; i < shape.getPath().getLength(); i++) {
        newShadowShape.heights.push(10)
    }
    this.shadowShapes.push(newShadowShape);
  }
}
