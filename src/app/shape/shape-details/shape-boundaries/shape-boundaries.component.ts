import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {ShadowShape} from "../../shadow-shape.model";

@Component({
  selector: 'app-shape-boundaries',
  templateUrl: './shape-boundaries.component.html',
  styleUrls: ['./shape-boundaries.component.css']
})
export class ShapeBoundariesComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ShapeBoundariesComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
