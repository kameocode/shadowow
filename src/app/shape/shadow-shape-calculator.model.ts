import {XY} from "./tranformable-point.model";
import {ShadowShape} from "./shadow-shape.model";
import {XYArray} from "./xy-array.model";
import LatLng = google.maps.LatLng;
import Point = google.maps.Point;


export class ShadowShapeCalculator {
  private r = 0.0000000001;
  private diff: number;

  private originPath: XYArray;
  shadowBlockPaths: XYArray[];

  constructor(sh: ShadowShape, private map: google.maps.Map, private sunAltitudeRad: number, private sunAzimuthRad: number) {
    this.diff = this.r * 10;
    this.collectPoints(sh);
  }

  private collectPoints(sh: ShadowShape) {
    const polygon = sh.origin;

    const rawShadowBlockPathsArr: LatLng[][] = [];
    const rawBasePath: LatLng[] = [];

    for (let i = 0; i < polygon.getPath().getLength(); i++) {
      const point: LatLng = polygon.getPath().getAt(i);
      const shadowPoint = this.calculateShadowPoint(sh, i);
      rawBasePath.push(point);

      // create shadow blocks for each two consecutive points,
      let j = i + 1;
      if (j >= polygon.getPath().getLength()) {
        j = 0;
      }
      const point2: LatLng = polygon.getPath().getAt(j);
      const shadowPoint2 = this.calculateShadowPoint(sh, j);
      rawShadowBlockPathsArr.push([point, point2, shadowPoint2, shadowPoint]);
    }
    this.originPath = XYArray.fromLatLng(this.map, this.sunAzimuthRad, rawBasePath);
    this.shadowBlockPaths = rawShadowBlockPathsArr.map(ra => XYArray.fromLatLng(this.map, this.sunAzimuthRad, ra));
  }


  public mergeShadowBlocksIntoOne(probablyHoles: Set<XYArray>) {
    let mergedShadow = this.originPath;
    let mergeIndex = 0;
    for (let sbp of this.shadowBlockPaths) {
      const points = sbp.perturbate();

      const unionResults = mergedShadow.union(points);
      if (unionResults.length > 1) {
        console.log("ERROR2, union failed:" + unionResults.length + " for index " + this.shadowBlockPaths.indexOf(sbp) + " ");
        // fun: (mergedShadow: XYArray, index: number, points: XYArray)=>void
        // fun(mergedShadow, ++mergeIndex, points);
      }

      // union is the biggest part, other are holes
      let indexOfMaxArea = this.findIndexOfMaxArea(unionResults);
      unionResults.forEach((ur, index) => {
        if (index == indexOfMaxArea) {
          mergedShadow = ur;
        } else {
          probablyHoles.add(ur);
          ur.reverseToNotPerturbatedPoints(points);
        }
      });
      mergedShadow.reverseToNotPerturbatedPoints(points);
    }
    return mergedShadow;
  }

  public substractShadowBlocksFromHoles(probablyHoles: Set<XYArray>) {
    const toRemove = new Set<XYArray>();
    const toAdd = new Set<XYArray>();

    for (let shadowBlock of this.shadowBlockPaths) {
      probablyHoles.forEach(probablyHole => {
        // for toPerturbatedPoint didn't diff properly??
        const shadowPoints = shadowBlock.perturbate2();//calculator.toPerturbatedPoint2(shadowBlock);

        // the diff doesn't work as expected, so subsequent filter was required
        //const diffResult = greinerHormann.diff(probablyHole, shadowPoints);
        const diffResult = probablyHole.diff(shadowPoints);
        diffResult.filter(u1 => !u1.equals(shadowPoints))
          .forEach(u1 => {
            u1.reverseToNotPerturbatedPoints(shadowPoints);
            this.cleanupAfterDegeneracies(u1.getPoints());
            if (u1.length > 0) {
              toAdd.add(u1);
            }
          });
        if (diffResult.length > 0) {
          toRemove.add(probablyHole);
        }
      });
      toRemove.forEach(ph => probablyHoles.delete(ph));
      toAdd.forEach(ph => probablyHoles.add(ph));
      toAdd.clear();
      toRemove.clear();
    }
  }

  public substractOriginFromHoles(probablyHoles: Set<XYArray>) {
    const toAdd = new Set();
    const originPathPerturbated = this.originPath.perturbate2();

    probablyHoles.forEach(p => {
      const diffResult = p.diff(originPathPerturbated);

      let areaOfHole = p.calculateArea();

      diffResult.forEach(u => {
        u.reverseToNotPerturbatedPoints(originPathPerturbated);
        this.cleanupAfterDegeneracies(u.getPoints());
        if (u.length > 0) {
          let areaOfHoleAfterDiff = u.calculateArea();

          const inOriginal = this.isInOriginalShadow(u);
          const inOriginal2 = this.isInOriginalShadow(u.rescale(0.0009));

          if ((!inOriginal || !inOriginal2) && ((areaOfHoleAfterDiff < areaOfHole && Math.abs(areaOfHole - areaOfHoleAfterDiff) > 0.00003) || diffResult.length == 1)) {
            toAdd.add(u);
          }
        }
      });
    });
    probablyHoles.clear();
    toAdd.forEach(r => probablyHoles.add(r));
  }


  public prepareHoles(mergedShadow: XYArray, probablyHoles: Set<XYArray>) {
    const mergedShadowPath = mergedShadow.getPath();
    let problematicToRemoveArrLatLang = [];
    probablyHoles.forEach(ph =>
      problematicToRemoveArrLatLang.push([...ph.getPath()].reverse())
    );
    problematicToRemoveArrLatLang.push([...this.originPath.getPath()].reverse());


    if (problematicToRemoveArrLatLang.length > 0) {
      const signedAreaOfShadow = google.maps.geometry.spherical.computeSignedArea(mergedShadowPath);
      return problematicToRemoveArrLatLang.map(h => {
        const signedAreaOfHole = google.maps.geometry.spherical.computeSignedArea(h);
        const isDifferentSign = (signedAreaOfShadow > 0 && signedAreaOfHole > 0) || (signedAreaOfShadow < 0 && signedAreaOfHole < 0);
        if (isDifferentSign) {
          h = [...h].reverse();
        }
        return h;
      })
    } else
      return null;
  }

  public cleanupAfterDegeneracies(u: XY[]) {
    this.removeTooClosePoints(u);
    while (this.removeTooSmallAngles(u) > 0) {
      this.removeTooClosePoints(u);
    }
  }

  private removeTooClosePoints(u: XY[]) {
    // remove points with too little distances
    if (u.length == 0)
      return;
    for (let i = u.length - 1; i >= 0; i--) {
      const u1 = u[i];
      for (let j = i - 1; j >= 0; j--) {
        const u2 = u[j];
        const tooClose = Math.abs(u1.x - u2.x) + Math.abs(u1.y - u2.y) < this.diff;
        if (tooClose) {
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

  private removeTooSmallAngles(u: XY[]) {
    let removedCount = 0;
    for (let i = 1; i <= u.length; i += 1) {
      const a = u[i - 1];
      const b = u[i % u.length];
      const c = u[(i + 1) % u.length];

      const vector1 = new Point(b.x - a.x, b.y - a.y);
      const vector2 = new Point(b.x - c.x, b.y - c.y);

      const angleDeg = (Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x)) * 180 / Math.PI;//Math.atan2(vector2.y - vector1.y, vector2.x - vector1.x) * 180 / Math.PI;
      if (Math.abs(angleDeg) < 0.01) {
        u.splice(i % u.length, 1);
        removedCount++;
      }
    }
    return removedCount;
  }

  private calculateShadowPoint(sh: ShadowShape, i: number) {
    const point: LatLng = sh.origin.getPath().getAt(i);
    const shadowLength = sh.heights[i] / Math.tan(this.sunAltitudeRad);
    return google.maps.geometry.spherical.computeOffset(point, shadowLength, this.sunAzimuthRad * 180 / Math.PI);
  }

  private findIndexOfMaxArea(uu: XYArray[]) {
    let indexOfMaxArea = 0, maxArea = 0;
    uu.forEach((ua, index) => {
      const currentArea = ua.calculateArea();
      if (currentArea > maxArea) {
        indexOfMaxArea = index;
        maxArea = currentArea;
      }
    });
    return indexOfMaxArea;
  }

  private isInOriginalShadow(arr: XYArray) {
    return arr.getPoints().every(p => {
      for (let bp of this.shadowBlockPaths) {
        if (bp.containsPoint(p))
          return true;
      }
      return this.originPath.containsPoint(p);
    });
  }


}
