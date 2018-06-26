import {TransformablePoint, XY} from "./tranformable-point.model";
import LatLng = google.maps.LatLng;
import Point = google.maps.Point;

const greinerHormann = require('greiner-hormann');

export class XYArray {
  private r = 0.0000000001;
  private err: number = this.r * 10;

  private path: LatLng[] = null;
  private points: XY[] = null;
  private origin: XYArray = null;
  private map: google.maps.Map;
  private sunAzimuthRad: number;

  static fromLatLng(map: google.maps.Map, sunAzimuthRad: number, path: LatLng[]) {
    const arr = new XYArray();
    arr.path = path;
    arr.map = map;
    arr.sunAzimuthRad = sunAzimuthRad;
    return arr;
  }

  static fromPoints(map: google.maps.Map, sunAzimuthRad: number, points: XY[]) {
    const arr = new XYArray();
    arr.points = points;
    arr.map = map;
    arr.sunAzimuthRad = sunAzimuthRad;
    return arr;
  }

  public getPoints(): XY[] {
    if (this.points == null) {
      this.points = this.path.map(latLng => {
          const p = this.map.getProjection().fromLatLngToPoint(latLng);
          return new TransformablePoint(p.x, p.y).rotatePo(-this.sunAzimuthRad);
        }
      );
    }
    return this.points;
  }

  get length() {
    if (this.points != null)
      return this.points.length;
    return this.path.length;
  }

  public getPath(): LatLng[] {
    if (this.path === null) {
      this.path = this.points.map(xy => {
        xy = new TransformablePoint(xy.x, xy.y).rotatePo(this.sunAzimuthRad);
        return this.map.getProjection().fromPointToLatLng(new Point(xy.x, xy.y))
      });
    }
    return this.path;
  }

  public union(arr: XYArray): XYArray[] {
    const points = this.getPoints();
    const unionResult = greinerHormann.union(points, arr.getPoints());
    return unionResult.map(ur => XYArray.fromPoints(this.map, this.sunAzimuthRad, ur));
  }

  public diff(arr: XYArray): XYArray[] {
    const points = this.getPoints();
    const diffResult = greinerHormann.diff(points, arr.getPoints());
    return diffResult.map(ur => XYArray.fromPoints(this.map, this.sunAzimuthRad, ur));
  }

  public perturbate(): XYArray {
    const points = this.getPoints();
    const arr = XYArray.fromPoints(this.map, this.sunAzimuthRad, this.rescaleArray(points, 1.00001 + this.smallRandom()));
    arr.origin = this;
    return arr;
  }

  public perturbate2(): XYArray {
    const points = this.getPoints();
    const arr = XYArray.fromPoints(this.map, this.sunAzimuthRad, this.rescaleArray(points, 1.00002 + this.smallRandom()));
    arr.origin = this;
    return arr;
  }

  public rescale(ratio: number): XYArray {
    const arr = XYArray.fromPoints(this.map, this.sunAzimuthRad, this.rescaleArray(this.getPoints(), ratio));
    arr.origin = this;
    return arr;
  }

  public move(x: number, y: number): XYArray {
    const path = this.path.map(point => {
      const latLng1 = google.maps.geometry.spherical.computeOffset(point, x, 90);
      const latLng2 = google.maps.geometry.spherical.computeOffset(latLng1, y, 0);
      return latLng2;
    });
    const arr = XYArray.fromLatLng(this.map, this.sunAzimuthRad, path);
    arr.origin = this;
    return arr;
  }

  public offset(xoffset: number, yoffset: number): XYArray {
    const arr = XYArray.fromPoints(this.map, this.sunAzimuthRad, this.getPoints().map(p =>
      new TransformablePoint(p.x, p.y)
        .movePo(xoffset, yoffset)));
    arr.origin = this;
    return arr;
  }

  public containsPoint(point: XY): boolean {
    const vs: XY[] = this.getPoints();
    // based on ray casting
    const x = point.x, y = point.y;

    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i].x, yi = vs[i].y;
      const xj = vs[j].x, yj = vs[j].y;

      const intersect = ((yi > y) != (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  public calculateArea() {
    const vertices: XY[] = this.getPoints();
    let total = 0;
    for (let i = 0, l = vertices.length; i < l; i++) {
      const addX = vertices[i].x;
      const addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y;
      const subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
      const subY = vertices[i].y;
      total += (addX * addY * 0.5);
      total -= (subX * subY * 0.5);
    }
    return Math.abs(total);
  }


  public reverseToNotPerturbatedPoints(perturbated: XYArray) {
    if (perturbated.origin == null) {
      throw new Error("perturbated path must have origin set (values before perturbation)")
    }
    let reversed = 0;
    this.getPoints().forEach(p => {
      const elem = perturbated.getPoints().find(p1 => p1.x == p.x && p1.y == p.y);
      if (elem != null) {
        const index = perturbated.getPoints().indexOf(elem);
        p.x = perturbated.origin.getPoints()[index].x;
        p.y = perturbated.origin.getPoints()[index].y;
        reversed++;
      }
    });
    // console.log("REVERSED "+reversed);
    this.path = null;
  }

  public equals(arr: XYArray): boolean {
    const arr1 = this.getPoints();
    const arr2 = arr.getPoints();
    if (arr1.length != arr2.length)
      return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i].x != arr2[i].x || arr1[i].y != arr2[i].y) {
        return false;
      }
    }
    return true;
  }

  private smallRandom() {
    const n = Math.random() * this.r;
    if (n > this.r || n < -this.r) {
      throw Error("Wrong n " + n);
    }
    return n;
  }

  private center(): XY {
    const points = this.getPoints();
    let x = points.map(x => x.x);
    let y = points.map(x => x.y);
    let cx = (Math.min(...x) + Math.max(...x)) / 2;
    let cy = (Math.min(...y) + Math.max(...y)) / 2;
    return {x: cx, y: cy};
  }


  private rescaleAndRotateArray(arr: XY[], ratio: number, rotate?: number) {
    const center = this.center();
    return arr.map(p => {
      return new TransformablePoint(p.x, p.y)
        .movePo(-center.x, -center.y)
        .scale(ratio)
        .movePo(center.x, center.y);
    });
  }

  private rescaleArray(arr: XY[], ratio: number, rotate?: number) {
    const center = this.center();
    return arr.map(p => {
      return new TransformablePoint(p.x, p.y)
        .movePo(-center.x, -center.y)
        .scale(ratio)
        .movePo(center.x, center.y);
    });
  }

}
