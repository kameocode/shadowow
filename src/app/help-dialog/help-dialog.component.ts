import {Component} from '@angular/core';
import {ShapesLoaderDialogComponent} from "../shape/shapes-loader-dialog/shapes-loader-dialog.component";
import {MatDialogRef} from "@angular/material";

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss']
})
export class HelpDialogComponent {

  constructor(public dialogRef: MatDialogRef<ShapesLoaderDialogComponent>) {
  }

  onClose() {
    this.dialogRef.close();
  }

}
