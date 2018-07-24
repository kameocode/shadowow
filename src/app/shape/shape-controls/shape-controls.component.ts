import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {XY} from "../tranformable-point.model";

@Component({
  selector: 'app-shape-controls',
  templateUrl: './shape-controls.component.html',
  styleUrls: ['./shape-controls.component.scss']
})
export class ShapeControlsComponent implements OnInit {

  @Output()
  moveShape = new EventEmitter<XY>();

  @Output()
  rotateShape = new EventEmitter<number>();

  constructor() { }

  ngOnInit() {
  }
  rotateLeft() {
    const degreeToRatate = 1;
    const r = -degreeToRatate * Math.PI / 180;
    this.rotateShape.emit(r);
  }
  rotateRight() {
    const degreeToRatate = 1;
    const r = degreeToRatate * Math.PI / 180;
    this.rotateShape.emit(r);
  }
  moveLeft() {
    this.moveShape.emit({x: -0.1, y: 0});
  }
  moveRight() {
    this.moveShape.emit({x: 0.1, y: 0});
  }
  moveUp() {
    this.moveShape.emit({x: 0, y: 0.1});
  }
  moveDown() {
    this.moveShape.emit({x: 0, y: -0.1});
  }
}
