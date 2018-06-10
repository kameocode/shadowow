import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import {AppComponent} from './app.component';
import { ShapeDetailsComponent } from './shape/shape-details/shape-details.component';
import {FormsModule} from "@angular/forms";
import { HoursSliderComponent } from './hours-slider/hours-slider.component';
import {MatSliderModule} from "@angular/material";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {ShadowCalculatorService} from "./shadow-calculator.service";


@NgModule({
  declarations: [
    AppComponent,
    ShapeDetailsComponent,
    HoursSliderComponent,

  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatSliderModule,
    NoopAnimationsModule
  ],
  providers: [ShadowCalculatorService],
  bootstrap: [AppComponent]
})
export class AppModule { }
