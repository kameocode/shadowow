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
  MatSliderModule
} from "@angular/material";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {ShadowCalculatorService} from "./shadow-calculator.service";
import {TimeDetailsComponent} from "./time-details/time-details.component"
import {ShapeBoundariesComponent} from "./shape/shape-details/shape-boundaries/shape-boundaries.component";
import {DayInfoComponent} from './day-info/day-info.component';
import {ShapesLoaderDialogComponent} from './shape/shapes-loader-dialog/shapes-loader-dialog.component';


@NgModule({
  declarations: [
    AppComponent,
    ShapeDetailsComponent,
    TimeDetailsComponent,
    ShapeBoundariesComponent,
    DayInfoComponent,
    ShapesLoaderDialogComponent,

  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatSliderModule,
    NoopAnimationsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  providers: [
    ShadowCalculatorService,
    MatDialog
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ShapeBoundariesComponent,
    ShapesLoaderDialogComponent]
})
export class AppModule {
}
