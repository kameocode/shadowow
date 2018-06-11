import { Component, OnInit } from '@angular/core';
import {MatSliderChange} from "@angular/material";
import {ShadowCalculatorService} from "../shadow-calculator.service";

@Component({
  selector: 'app-time-details',
  templateUrl: './time-details.component.html',
  styleUrls: ['./time-details.component.css']
})
export class TimeDetailsComponent implements OnInit {
  value: number = 17*60;
  maxValue = 24*60;
  date = new Date();


  constructor(private shadowService: ShadowCalculatorService) { }

  ngOnInit() {
    this.value = this.shadowService.getHour() * 60 + this.shadowService.getMinutes();

  }

  onChanged(event: MatSliderChange) {
    //this.shadowService.setTime(event.value/10);

    this.updateHour();

  }

  onDayChanged(day: Date) {
    console.log(this.date, event);
    this.shadowService.setDay(day);
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
    this.shadowService.setTime(hour, minutes);
  }
}
