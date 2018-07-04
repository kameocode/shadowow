import {Component, EventEmitter, Inject, OnInit, Output} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {SchematicOutput} from "@angular/cli/tasks/schematic-run";

@Component({
  selector: 'app-shape-boundaries',
  templateUrl: './shape-boundaries.component.html',
  styleUrls: ['./shape-boundaries.component.css']
})
export class ShapeBoundariesComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ShapeBoundariesComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
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

  onSaveData() {
    let originalDistances = [];
    let hasChanges = this.detectChanges(originalDistances);
    if (hasChanges) {
      console.log("emit event")
      this.data.shadowService.recalculateShape(this.data.distances);
    }
    this.onNoClick();
  }

  private detectChanges(originalDistances) {
    let hasChanges = false;
    this.data.shadowShape.origin.getPaths().getArray().forEach(path => {
      path.getArray().forEach((value, i) => {
        let tempIndex = i + 1;
        if (i === path.getArray().length - 1) {
          tempIndex = 0
        }
        originalDistances[i] = google.maps.geometry.spherical.computeDistanceBetween(value, path.getAt(tempIndex))
        console.log("data: " + originalDistances[i] + " " + this.data.distances[i]);
        if (originalDistances[i] !== this.data.distances[i]) {
          hasChanges = true;
        }
      })
    });
    return hasChanges;
  }
}
