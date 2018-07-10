import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';


import {AppComponent} from './app.component';
import {ShapeDetailsComponent} from './shape/shape-details/shape-details.component';
import {FormsModule} from "@angular/forms";
import {
  MatButtonModule,
  MatDatepickerModule,
  MatDialog,
  MatDialogModule,
  MatFormFieldModule, MatIconModule,
  MatNativeDateModule,
  MatSliderModule, MatTooltipModule
} from "@angular/material";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {ShadowCalculatorService} from "./shadow-calculator.service";
import {TimeDetailsComponent} from "./time-details/time-details.component"
import {ShapeBoundariesComponent} from "./shape/shape-details/shape-boundaries/shape-boundaries.component";
import {DayInfoComponent} from './time-details/day-info/day-info.component';
import {ShapesLoaderDialogComponent} from './shape/shapes-loader-dialog/shapes-loader-dialog.component';
import { HelpDialogComponent } from './help-dialog/help-dialog.component';
import {
  SolarInfoComponent
} from './time-details/solar-info/solar-info.component';
import {SolarInfoColumnComponent} from "./time-details/solar-info/solar-info-column/solar-info-column.component";
import { CurrentDayComponent } from './time-details/current-day/current-day.component';
import { PlacementComponent } from './placement/placement.component';


@NgModule({
  declarations: [
    AppComponent,
    ShapeDetailsComponent,
    TimeDetailsComponent,
    ShapeBoundariesComponent,
    DayInfoComponent,
    ShapesLoaderDialogComponent,
    HelpDialogComponent,
    SolarInfoComponent,
    SolarInfoColumnComponent,
    CurrentDayComponent,
    PlacementComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    // MatSliderModule,
    NoopAnimationsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  providers: [
    ShadowCalculatorService,
    MatDialog
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ShapeBoundariesComponent,
    ShapesLoaderDialogComponent,
    HelpDialogComponent]
})
export class AppModule {
}
