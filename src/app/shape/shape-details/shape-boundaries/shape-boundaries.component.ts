import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

@Component({
  selector: 'app-shape-boundaries',
  templateUrl: './shape-boundaries.component.html',
  styleUrls: ['./shape-boundaries.component.css']
})
export class ShapeBoundariesComponent implements OnInit {

  original: ShapeBoundariesProperties;
  modified: ShapeBoundariesProperties;

  constructor(public dialogRef: MatDialogRef<ShapeBoundariesComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.calculateDistances();
    this.calculateAngles();
  }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }


  heightTracker(index, obj): any {
    return index;
  }

  onDistanceChanged(index:number) {
    console.log(index);
    console.log()

    this.data.shadowService.recalculateShape(index, this.modified.distances[index], this.modified.angles[index]);
  }

  onAngleChanged(index:number) {
    this.data.shadowService.recalculateShape(index, this.modified.distances[index], this.modified.angles[index]);
  }

  calculateDistances() {
    this.original = {
      distances: [],
      angles: []
    };

    this.modified = {
      distances: [],
      angles: []
    }
    this.data.shadowShape.origin.getPaths().getArray().forEach(path => {
      path.getArray().forEach((value, i) => {
        let tempIndex = i + 1;
        if (i === path.getArray().length - 1) {
          tempIndex = 0
        }
        this.original.distances[i] = Number(google.maps.geometry.spherical.computeDistanceBetween(value, path.getAt(tempIndex)).toFixed(2));
        this.modified.distances[i] = this.original.distances[i];
      })
    });
  }


  private calculateAngles() {
    this.data.shadowShape.origin.getPaths().getArray().forEach(path => {
      path.getArray().forEach((value, i) => {
        //console.log(value);
        let tempIndex2 = (i + 2) % (path.getArray().length);
        let tempIndex = (i + 1);
        if (i === path.getArray().length - 1) {
          tempIndex = 0
        }
        let angle1North = Number(google.maps.geometry.spherical.computeHeading(value, path.getAt(tempIndex)).toFixed(2));
        let angle2North = Number(google.maps.geometry.spherical.computeHeading(path.getAt(tempIndex), path.getAt(tempIndex2)).toFixed(2));

        console.log("[" + i + ", " + tempIndex + "][" + tempIndex + ", " + tempIndex2 + "]" + angle1North + " " + angle2North);


        this.original.angles[i] = Number(google.maps.geometry.spherical.computeHeading(value, path.getAt(tempIndex)).toFixed(2));
        this.modified.angles[i] = this.original.angles[i];
      })
    });
  }

}


interface ShapeBoundariesProperties {
  distances: number[];
  angles: number[];
}
