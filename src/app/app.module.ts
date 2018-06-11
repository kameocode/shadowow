import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import {AppComponent} from './app.component';
import { ShapeDetailsComponent } from './shape/shape-details/shape-details.component';
import {FormsModule} from "@angular/forms";
import {MatDatepickerModule, MatFormFieldModule, MatNativeDateModule, MatSliderModule} from "@angular/material";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {ShadowCalculatorService} from "./shadow-calculator.service";
import {TimeDetailsComponent} from "./time-details/time-details.component";


@NgModule({
  declarations: [
    AppComponent,
    ShapeDetailsComponent,
    TimeDetailsComponent,

  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatSliderModule,
    NoopAnimationsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule
  ],
  providers: [ShadowCalculatorService],
  bootstrap: [AppComponent]
})
export class AppModule { }
