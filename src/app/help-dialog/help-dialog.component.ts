import { Component, OnInit } from '@angular/core';
import {ShapesLoaderDialogComponent} from "../shape/shapes-loader-dialog/shapes-loader-dialog.component";
import {MatDialogRef} from "@angular/material";

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.css']
})
export class HelpDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ShapesLoaderDialogComponent>,) { }

  ngOnInit() {
  }

  onClose() {
    this.dialogRef.close();
  }

}
