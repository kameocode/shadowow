export const colors = {
  colorArea: "#a7ffeb"
};

export class MarkersSet {
  private readonly map: google.maps.Map;
  private currentMarkers: google.maps.Marker[] = [];
  private nodeSelectedCallback: (m: google.maps.Marker) => void = () => {
  };

  constructor(map: google.maps.Map, nodeSelectedCallback: (m: google.maps.Marker) => void) {
    this.nodeSelectedCallback = nodeSelectedCallback;
    this.map = map;
  }


  public clearMarkers() {
    this.currentMarkers.forEach(marker => marker.setMap(null));
    this.currentMarkers = [];
    this.nodeSelectedCallback(null);
  }

  public moveMarkers(x: number, y: number) {
    this.currentMarkers.forEach(m => {
      const pos = m.getPosition();
      const latLng1 = google.maps.geometry.spherical.computeOffset(pos, x, 90);
      const latLng2 = google.maps.geometry.spherical.computeOffset(latLng1, y, 0);
      m.setPosition(latLng2)
    });
  }


  public createMarkers(newShape: google.maps.Polygon, withClear: boolean = true) {
    if (withClear)
      this.clearMarkers();

    const path: google.maps.MVCArray<google.maps.LatLng> = newShape.getPath();
    let increment = 1;
    for (let i = 0; i < path.getLength(); i += increment) {
      const point = path.getAt(i);
      this.addMarker(point, '' + (i + 1));
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

    google.maps.event.addListener(marker, 'mouseover', () => {
      marker.setIcon({
        labelOrigin: new google.maps.Point(11, 13),
        url: 'assets/pin-white.svg',
        anchor: new google.maps.Point(11, 33),
      });
      this.currentMarkers.forEach(m => {
        if (m != marker) {
          m.setIcon({
            labelOrigin: new google.maps.Point(11, 13),
            url: 'assets/pin.svg',
            anchor: new google.maps.Point(11, 33),
          });
        }
      });
      this.nodeSelectedCallback(marker);

    });

    google.maps.event.addListener(marker, 'mouseout', () => {
      /* marker.setIcon({
         labelOrigin: new google.maps.Point(11, 13),
         url: 'assets/pin.svg',
         anchor: new google.maps.Point(11, 33),
       });*/
    });
    this.currentMarkers.push(marker)
  }
}


