import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

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

  onSaveData() {
    this.data.shadowService.recalculateShape({distances: this.data.distances, angles: this.data.angles});
    this.onNoClick();
  }
}
