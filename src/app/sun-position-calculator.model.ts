import LatLng = google.maps.LatLng;
import Point = google.maps.Point;

export class SunPositionCalculator {
  private boundsMarker = null;

  public constructor(private map: google.maps.Map) {

  }

  public recalculatePositionOfSunIconOnTheMap(azimuthRad: number) {
    const bounds = this.map.getBounds();
    if (bounds == null)
      return;

    const nwLatLng = new LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng());
    const neLatLng = new LatLng(bounds.getNorthEast().lat(), bounds.getNorthEast().lng());
    const swLatLng = new LatLng(bounds.getSouthWest().lat(), bounds.getSouthWest().lng());

    const topLeft = this.fromLatLngToPoint(nwLatLng);
    const topRight = this.fromLatLngToPoint(neLatLng);
    const bottomLeft = this.fromLatLngToPoint(swLatLng);
    const p_center = this.fromLatLngToPoint(this.map.getCenter());
    let alpha = azimuthRad;
    let alphaDeg = azimuthRad * 180 / Math.PI;
    let margin = 0;

    const width = topRight.x - topLeft.x;
    const height = bottomLeft.y - topLeft.y;
    const y_half = height / 2;
    const x_half = width / 2;


    let a = y_half;
    let b = a * Math.tan(-alpha);
    let sunPoint = new Point(p_center.x + b, height - margin);
    if (sunPoint.x >= topLeft.x+margin && sunPoint.x <= topRight.x-margin) {
      if (alphaDeg > 90 || alphaDeg < -90) {
        // top
        sunPoint = new Point(p_center.x - b, margin);
      } else {
        sunPoint = new Point(p_center.x + b, height - margin);
      }
    } else {
      b = x_half;
      a = b / Math.tan(-alpha);
      if (alphaDeg > 0) {
        // left upper corner
        sunPoint = new Point(margin, p_center.y - a);
      } else {
        sunPoint = new Point(width - margin, p_center.y + a);
      }
    }
    this.printMarker(sunPoint, width, height, margin);
  }

  private fromLatLngToPoint(latLng: LatLng) {
    const map = this.map;
    const projection = map.getProjection();
    const topRight = projection.fromLatLngToPoint(map.getBounds().getNorthEast());
    const bottomLeft = projection.fromLatLngToPoint(map.getBounds().getSouthWest());
    const scale = Math.pow(2, map.getZoom());
    const worldPoint = projection.fromLatLngToPoint(latLng);
    return new Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
  }

  private pixelToLatlng(p: Point) {
    const map = this.map;
    const ne = map.getBounds().getNorthEast();
    const sw = map.getBounds().getSouthWest();
    const projection = map.getProjection();
    const topRight = projection.fromLatLngToPoint(ne);
    const bottomLeft = projection.fromLatLngToPoint(sw);
    const scale = 1 << map.getZoom();
    const newLatlng = projection.fromPointToLatLng(new google.maps.Point(p.x / scale + bottomLeft.x, p.y / scale + topRight.y));
    return newLatlng;
  };

  private printMarker(p: Point, width: number, height: number, margin: number) {
    p = this.normalize(p, width, height, margin);
    if (this.boundsMarker == null) {
      this.boundsMarker = new google.maps.Marker({
        position: this.pixelToLatlng(p),
        map: this.map,
        icon: {
          url: 'assets/sun_on_map.svg',
          anchor: new google.maps.Point(30, 30), // half size of image
        }
      });
    } else {
      this.boundsMarker.setPosition(this.pixelToLatlng(p));
    }
  }

  private normalize(p: Point, w: number, h: number, margin: number) {
    if (p.x < margin) {
      p.x = margin;
    } else if (p.x > w - margin) {
      p.x = w - margin;
    }
    if (p.y < margin) {
      p.y = margin;
    } else if (p.y > h - margin) {
      p.y = h - margin;
    }
    return p;

  }

}
