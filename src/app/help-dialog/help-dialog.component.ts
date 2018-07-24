import {Component} from '@angular/core';
import {MatDialogRef} from "@angular/material";
import {isDeviceMobile} from "../utils";

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss']
})
export class HelpDialogComponent {
  mobile: boolean = isDeviceMobile();

  constructor(public dialogRef: MatDialogRef<HelpDialogComponent>) {
  }

  onClose() {
    this.dialogRef.close();
  }

}
