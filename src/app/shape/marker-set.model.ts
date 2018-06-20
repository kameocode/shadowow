export const colors = {
  colorArea: "#a7ffeb" //"#fffff0" //"#a7ffeb"
};

export class MarkersSet {
  private readonly map: google.maps.Map;
  private currentMarkers: google.maps.Marker[] = [];


  constructor(map: google.maps.Map) {
    this.map = map;
  }


  public clearMarkers() {
    this.currentMarkers.forEach(marker => marker.setMap(null));
    this.currentMarkers = [];
  }
  public createMarkers(newShape: google.maps.Polygon, withClear: boolean = true) {
    if (withClear)
      this.clearMarkers();

    const path: google.maps.MVCArray<google.maps.LatLng> = newShape.getPath();
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      this.addMarker(point,  '' + (i + 1));
    }
  }

  public addMarker(point: google.maps.LatLng, label: string) {
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(point.lat(), point.lng()),
      map: this.map,
      label,
      icon: {
        labelOrigin: new google.maps.Point(11, 13),
        url: 'assets/pin.svg',
        anchor: new google.maps.Point(11, 33),
      }
    });

    this.currentMarkers.push(marker)
  }
}


