import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import {AppComponent} from './app.component';
import { ShapeDetailsComponent } from './shape/shape-details/shape-details.component';


@NgModule({
  declarations: [
    AppComponent,
    ShapeDetailsComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
