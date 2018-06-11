import { Component, OnInit } from '@angular/core';
import {MatSliderChange} from "@angular/material";
import {ShadowCalculatorService} from "../shadow-calculator.service";

@Component({
  selector: 'app-hours-slider',
  templateUrl: './hours-slider.component.html',
  styleUrls: ['./hours-slider.component.css']
})
export class HoursSliderComponent implements OnInit {
  value: number = 17*60;
  maxValue = 24*60;
  date = new Date();


  constructor(private shadowService: ShadowCalculatorService) { }

  ngOnInit() {
    this.value = this.shadowService.getHour() * 60 + this.shadowService.getMinutes();

  }

  onChanged(event: MatSliderChange) {
    //this.shadowService.setHour(event.value/10);

    this.updateHour();

  }

  onDateChange(event: any) {
    console.log(this.date);
  }

  get hour() {
    return  Math.trunc(this.value/60);
  }
  get minutes() {
    return  this.value % 60;
  }

  increment() {
    this.value+=10;
    this.updateHour();

  }
  decrement() {
    this.value-=10;
    this.updateHour();

  }

  private updateHour() {
    const hour = this.hour;
    const minutes = this.minutes;
    // console.log("value "+this.value+" hour "+hour+" "+minutes+" "+(24*60));
    this.shadowService.setHour(hour, minutes);
  }
}
