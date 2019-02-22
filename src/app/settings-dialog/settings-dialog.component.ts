import {Component, Input, OnInit} from '@angular/core';
import {MatDialogRef} from "@angular/material";
import {ShadowCalculatorService} from "../shadow-calculator.service";
import {ShadowVisualPreferences} from "../shape/shadow-shape.model";

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent implements OnInit {
  public visualPreferences: ShadowVisualPreferences;

  constructor(public dialogRef: MatDialogRef<SettingsDialogComponent>, public shadowService: ShadowCalculatorService) { }

  ngOnInit() {
    this.visualPreferences = this.shadowService.visualPreferences;
  }

  onClose() {
    this.dialogRef.close();
  }
  updateShadowVisualPreferences() {
    this.shadowService.updateShadowPreferences()
  }


}
