import Point = google.maps.Point;

export interface XY {
  x: number,
  y: number
}


export class TransformablePoint {
  constructor(public x: number, public y: number) {
  }

  public static of(p: Point): TransformablePoint {
    return new TransformablePoint(p.x, p.y);
  }

  public movePo(x: number, y: number): TransformablePoint {
    return new TransformablePoint(this.x + x, this.y + y);
  }

  public scale(ratio: number): TransformablePoint {
    return new TransformablePoint(this.x * ratio, this.y * ratio);
  }

  public rotatePo(angleRad: number): TransformablePoint {
    const y = this.x * Math.sin(angleRad) + this.y * Math.cos(angleRad);
    const x = this.x * Math.cos(angleRad) - this.y * Math.sin(angleRad);
    return new TransformablePoint(x, y);
  }
}


