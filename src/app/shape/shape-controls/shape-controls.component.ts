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

  private unitsToTransform(shiftHeld : boolean, baseUnits: number){
    const multiplier = 15; 
    return shiftHeld ? baseUnits * multiplier : baseUnits;
  }

  ngOnInit() {
  }
  rotateLeft(event) {
    const r = this.unitsToTransform(event.shiftKey, -1) * Math.PI / 180;
    this.rotateShape.emit(r);
  }
  rotateRight(event) {
    const r = this.unitsToTransform(event.shiftKey, 1) * Math.PI / 180;
    this.rotateShape.emit(r);
  }
  moveLeft(event) {
    this.moveShape.emit({x: this.unitsToTransform(event.shiftKey, -0.1), y: 0});
  }
  moveRight(event) {
    this.moveShape.emit({x: this.unitsToTransform(event.shiftKey, 0.1), y: 0});
  }
  moveUp(event) {
    this.moveShape.emit({x: 0, y: this.unitsToTransform(event.shiftKey, 0.1)});
  }
  moveDown(event) {
    this.moveShape.emit({x: 0, y: this.unitsToTransform(event.shiftKey, -0.1)});
  }
}
