import {Component, HostListener, OnInit} from '@angular/core';
import {MatSliderChange} from "@angular/material";
import {ShadowCalculatorService} from "../shadow-calculator.service";

@Component({
  selector: 'app-time-details',
  templateUrl: './time-details.component.html',
  styleUrls: ['./time-details.component.css']
})
export class TimeDetailsComponent implements OnInit {
  value: number = 17*60;
  readonly maxValue = 24*60;
  date = new Date();
  private readonly step: number = 10;


  constructor(private shadowService: ShadowCalculatorService) { }

  ngOnInit() {
    this.value =  this.computeValue();
    this.shadowService.date$.subscribe((date) => {
      this.value = this.computeValue();
      this.date = date;
    })
  }

  private computeValue() {
    return this.shadowService.getHour() * 60 + this.shadowService.getMinutes();
  }

  onChanged(event: MatSliderChange) {
    this.updateHour();
  }

  onDayChanged(day: Date) {
    this.shadowService.setDay(day);
  }

  get hour() {
    return  Math.trunc(this.value/60);
  }
  get minutes() {
    return  this.value % 60;
  }

  increment() {
    if (this.value + this.step <= this.maxValue) {
      this.value += this.step;
      this.updateHour();
    }

  }
  decrement() {
    if (this.value - this.step > 0) {
      this.value -= this.step;
      this.updateHour();
    }
  }

  private updateHour() {
    const hour = this.hour;
    const minutes = this.minutes;
    this.shadowService.setTime(hour, minutes);
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'b')
      this.decrement();
    else if (event.key === 'n')
      this.increment();
    else if (event.key === 'c') {
      const temp = new Date(this.date.getTime() - 1000*60*60*24);
      this.date = temp;
      this.shadowService.setDay(this.date);
    } else if (event.key === 'v') {
      const temp = new Date(this.date.getTime()+ 1000*60*60*24);
      this.date = temp;
      this.shadowService.setDay(this.date);
    }


  }

}
