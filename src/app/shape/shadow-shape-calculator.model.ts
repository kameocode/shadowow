import {TransformablePoint} from "./tranformable-point.model";
import {ShadowShape} from "./shadow-shape.model";
import LatLng = google.maps.LatLng;
import Point = google.maps.Point;

export class ShadowShapeCalculator {
  r = 0.0000000001; //0.000000000001;
  diff: number;
  rawShadowBlockPathsArr: LatLng[][] = [];
  rawShadowTopPath: LatLng[] = [];
  rawBasePath: LatLng[] = [];

  constructor(private map: google.maps.Map, private sunAltitudeRad: number, private sunAzimuthRad: number) {
    this.diff = this.r * 100;
  }

  private perturbate() {
    const n = Math.random() * this.r;
    if (n > this.r || n < -this.r) {
      throw Error("Wrong n " + n);
    }
    return n;
  }

  public addShadowBlockPath(u: LatLng[],) {
    this.rawShadowBlockPathsArr.push(u);
    const points = this.toPerturbatedPoint(u);
  }

  addBasePoint(point: google.maps.LatLng) {
    this.rawBasePath.push(point);
  }

  addShadowTopPoint(point: google.maps.LatLng) {
    this.rawShadowTopPath.push(point);
  }


  public toPerturbatedPoint(u: google.maps.LatLng[]) {
    let points = u.map(latLng => {
      const p = this.map.getProjection().fromLatLngToPoint(latLng);
      return new TransformablePoint(p.x, p.y).rotatePo(-this.sunAzimuthRad);//.movePo(this.perturbate(), this.perturbate());
    });
    const center = this.centerOfPolygon(points);
    points = points.map(p => p.movePo(-center.x, -center.y));
    points = points.map(p => p.scale(1 + 0.0001+this.perturbate()));// 0.0001 //this.perturbate()*100)
    points = points.map(p => p.movePo(center.x, center.y));
    return points;
  }

  public toPerturbatedPoint2(u: google.maps.LatLng[]) {
    let points = u.map(latLng => {
      const p = this.map.getProjection().fromLatLngToPoint(latLng);
      return new TransformablePoint(p.x, p.y).rotatePo(-this.sunAzimuthRad);//.movePo(this.perturbate(), this.perturbate());
    });
    const center = this.centerOfPolygon(points);
    points = points.map(p => p.movePo(-center.x, -center.y));
    points = points.map(p => p.scale(1 + 0.0002+this.perturbate()));// 0.0001 //this.perturbate()*100)
    points = points.map(p => p.movePo(center.x, center.y));
    return points;
  }
  public toPerturbatedPoint3(u: google.maps.LatLng[]) {
    let points = u.map(latLng => {
      const p = this.map.getProjection().fromLatLngToPoint(latLng);
      return new TransformablePoint(p.x, p.y).rotatePo(-this.sunAzimuthRad);//.movePo(this.perturbate(), this.perturbate());
    });
    const center = this.centerOfPolygon(points);
    points = points.map(p => p.movePo(-center.x, -center.y));
    points = points.map(p => p.scale(1 +  0.0002+this.perturbate()));// 0.0001 //this.perturbate()*100)
    points = points.map(p => p.movePo(center.x, center.y));
    return points;
  }
  public toPerturbatedPointOLD(u: google.maps.LatLng[]) {
    const points = u.map(latLng => {
      const p = this.map.getProjection().fromLatLngToPoint(latLng);
      return new TransformablePoint(p.x, p.y).rotatePo(-this.sunAzimuthRad).movePo(-this.perturbate(), -this.perturbate());
    });
    return points;
  }

  private centerOfPolygon(arr: { x: number, y: number }[]) {
    let x = arr.map(x => x.x);
    let y = arr.map(x => x.y);
    let cx = (Math.min(...x) + Math.max(...x)) / 2;
    let cy = (Math.min(...y) + Math.max(...y)) / 2;
    return {x: cx, y: cy};
  }

  public equals(arr1: { x: number, y: number }[], arr2: { x: number, y: number }[])  {
    if (arr1.length !=arr2.length)
      return false;
    for (let i=0; i<arr1.length; i++) {
      if (arr1[i]!=arr2[i]) {
        return false;
      }
    }
    return true;
  }
  public cleanupAfterDegeneracies(u: { x: number, y: number }[]) {
    this.removeTooClosedPoints(u);
    while (this.removeTooSmallAngles(u)>0) {
      this.removeTooClosedPoints(u);
    }
  }
  private removeTooClosedPoints(u: { x: number, y: number }[]) {
    // remove points with too little distances

    if (u.length ==0)
      return;
    for (let i = u.length - 1; i >= 0; i--) {
      const u1 = u[i];
      for (let j = i - 1; j >= 0; j--) {
        const u2 = u[j];
        const tooClose = Math.abs(u1.x - u2.x) + Math.abs(u1.y - u2.y) < this.diff;
        // console.log("DIFF "+i+" "+j+" "+ ((Math.abs(u1.x-u2.x)+Math.abs(u1.y-u2.y))));
        if (tooClose) {
          const p = new TransformablePoint(u1.x, u1.y).rotatePo(+this.sunAzimuthRad);
          u.splice(j, 1);
          i--;
        } else
          break;
      }
    }
    const tooClose = Math.abs(u[0].x - u[u.length - 1].x) + Math.abs(u[0].y - u[u.length - 1].y) < this.diff;
    if (tooClose)
      u.splice(u.length - 1, 1);
  }

  private removeTooSmallAngles(u: { x: number, y: number }[]) {
    let removedCount = 0;
    for (let i = 1; i <= u.length; i += 1) {
      const a = u[i - 1];
      const b = u[i % u.length];
      const c = u[(i + 1) % u.length];

      const vector1 = new Point(b.x - a.x, b.y - a.y);
      const vector2 = new Point(b.x - c.x, b.y - c.y);

      var angleDeg = (Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x)) * 180 / Math.PI;//Math.atan2(vector2.y - vector1.y, vector2.x - vector1.x) * 180 / Math.PI;
      if (Math.abs(angleDeg) < 0.01) {
        // remove point b&c
        // u.splice((i+1) % u.length, 1);
        u.splice(i % u.length, 1);
        removedCount++;
      }
      const p = new TransformablePoint(b.x, b.y).rotatePo(this.sunAzimuthRad);
      //this.shadowMarkersSet.addMarker(this.map.getProjection().fromPointToLatLng(new Point(p.x + 0.0002, p.y)),"M"+(i % u.length));
    }
    return removedCount;
  }


  toLatLang(numbers: { x: number, y: number }[], xoffset = 0) {
    return numbers.map(p => {
      p = new TransformablePoint(p.x, p.y).rotatePo(+this.sunAzimuthRad);
      return this.map.getProjection().fromPointToLatLng(new Point(p.x + xoffset, p.y));
    });
  }


  calculateShadowPoint(sh: ShadowShape, i: number) {
    const point: LatLng = sh.shape.getPath().getAt(i);
    const shadowLength = sh.heights[i] / Math.tan(this.sunAltitudeRad);
    return google.maps.geometry.spherical.computeOffset(point, shadowLength, this.sunAzimuthRad * 180 / Math.PI);
  }


}
