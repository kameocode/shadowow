import {Component, Input, OnInit} from '@angular/core';
import {ShadowShape} from "../shadow-shape.model";
import {ShadowCalculatorService} from "../../shadow-calculator.service";
import {MatDialog} from "@angular/material";
import {ShapeBoundariesComponent} from "./shape-boundaries/shape-boundaries.component";
import Marker = google.maps.Marker;

@Component({
  selector: 'app-shape-details',
  templateUrl: './shape-details.component.html',
  styleUrls: ['./shape-details.component.css']
})
export class ShapeDetailsComponent implements OnInit {
  @Input()
  shadowShape: ShadowShape;
  @Input()
  marker: Marker;
  @Input()
  markerIndex: number;
  @Input()
  currentHeight: number;
  @Input()
  currentShadow: number;


  constructor(private shadowService: ShadowCalculatorService, private dialog: MatDialog) {
  }


  ngOnInit() {

  }

  get markerLabel() {
    if (this.marker != null) {
      return this.marker.getLabel();
    } else return null;
  }

  trackByIdx(index: number, obj: any): any {
    return index;
  }

  onHeightChanged(height: number) {
    this.shadowService.recalculateShadows();
  }

  openSettingsDialog() {
    this.dialog.open(ShapeBoundariesComponent, {
      minWidth: '450',
      minHeight: '420',
      data: this.shadowShape
    });
  }


  onChangeCurrentHeight(height: number) {
    this.currentHeight = height;
    this.shadowService.setCurrentHeight(height);
    if (this.shadowShape != null) {
      this.shadowShape.heights[this.markerIndex] = height;
    }
    this.shadowService.recalculateShadows();
  }
}
