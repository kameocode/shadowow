export const colors = {
  colorArea: "#a7ffeb" //"#fffff0" //"#a7ffeb"
};

export class MarkersSet {
  private readonly map: google.maps.Map;
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
        label: '' + (i + 1),
        icon: {
          labelOrigin: new google.maps.Point(15, 13),
          url: 'assets/pin.svg',
          anchor: new google.maps.Point(15, 43),
        }
      });

      this.currentMarkers.push(marker)
    }
  }
}


