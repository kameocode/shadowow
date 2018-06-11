import Point = google.maps.Point;

export class TransformablePoint {
  constructor(public x: number, public y: number) {
  }

  public static of(p: Point):TransformablePoint {
    return new TransformablePoint(p.x, p.y);
  }

  public movePo(x: number, y: number): TransformablePoint {
    return new TransformablePoint(this.x + x, this.y + y);
  }

  public rotatePo(angleRad: number): TransformablePoint {
    const y = this.x * Math.sin(angleRad) + this.y * Math.cos(angleRad);
    const x = this.x * Math.cos(angleRad) - this.y * Math.sin(angleRad);
    return new TransformablePoint(x, y);
  }
}


interface MinmaxIndices {
  maxLatIndex: number;
  minLatIndex: number;
  maxLngIndex: number;
  minLngIndex: number;
}

export function findMinMax(path: TransformablePoint[], prefix = ''): MinmaxIndices {
  let maxLat = path[0];
  let maxLng = path[0];
  let minLat = path[0];
  let minLng = path[0];
  let maxLatIndex = 0;
  let minLatIndex = 0;
  let maxLngIndex = 0;
  let minLngIndex = 0;

  path.forEach((p, index) => {
    //console.log("indexB " + (index + 1) + " " + p.toString());
    if (maxLat.x < p.x) {
      maxLatIndex = index;
      maxLat = p;
    }
    if (minLat.x > p.x) {
      minLatIndex = index;
      minLat = p;
    }
    if (maxLng.y < p.y) {
      //console.log("index "+index+" compareMAX "+maxLng.lng()+" "+p.lng());
      maxLngIndex = index;
      maxLng = p;
    }
    if (minLng.y > p.y) {
      //console.log("index "+index+" compareMIN "+minLng.lng()+" "+p.lng());
      minLngIndex = index;
      minLng = p;
    }

  });

  console.log(prefix + " x: min=" + (minLatIndex + 1) + ", max=" + (maxLatIndex + 1));
  console.log(prefix + " y: min=" + (minLngIndex + 1) + ", max=" + (maxLngIndex + 1));

  return {
    maxLatIndex,
    minLatIndex,
    maxLngIndex,
    minLngIndex,
  }
}
