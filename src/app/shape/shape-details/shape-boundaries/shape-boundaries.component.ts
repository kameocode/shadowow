import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {ShadowShape} from "../../shadow-shape.model";

@Component({
  selector: 'app-shape-boundaries',
  templateUrl: './shape-boundaries.component.html',
  styleUrls: ['./shape-boundaries.component.css']
})
export class ShapeBoundariesComponent implements OnInit {
  private shadowShapes: ShadowShape[] = [];
  private distances =[];
  private angles = [];

  constructor(public dialogRef: MatDialogRef<ShapeBoundariesComponent>, @Inject(MAT_DIALOG_DATA) public shadowShape: ShadowShape) {
  }

  ngOnInit() {
     this.calculateDistances();
     this.calculateAngles();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }


  heightTracker(index, obj): any {
    return index;
  }

  onDistanceChange($event) {

  }

  onAngleChange($event) {

  }

  onSaveData($event) {

  }

  calculateDistances() {
    this.shadowShape.origin.getPaths().getArray().forEach(path => {
      path.getArray().forEach( (value, i) => {
        //console.log(value);
        let tempIndex = i + 1;
        if (i === path.getArray().length - 1) {
          tempIndex = 0
        }
        this.distances[i] = google.maps.geometry.spherical.computeDistanceBetween(value, path.getAt(tempIndex))
      })
    });
    this.distances.forEach(dist => {
      console.log(dist)
    })
  }

  calculateAngles() {
    this.shadowShape.origin.getPaths().getArray().forEach(path => {
      path.getArray().forEach( (value, i) => {
        console.log(value);
        let tempIndex = i + 1;
        if (i === path.getArray().length - 1) {
          tempIndex = 0
        }
        this.distances[i] = google.maps.geometry.spherical.computeDistanceBetween(value, path.getAt(tempIndex))

      })
    });


  }
}
