import {Component, HostListener, Input, OnInit} from '@angular/core';
import {MatSliderChange} from "@angular/material";
import {ShadowCalculatorService} from "../shadow-calculator.service";
import {ShadowShapeSet} from "../shape/shadow-shape.model";

@Component({
  selector: 'app-time-details',
  templateUrl: './time-details.component.html',
  styleUrls: ['./time-details.component.css']
})
export class TimeDetailsComponent implements OnInit {
  date = new Date();


  constructor(private shadowService: ShadowCalculatorService) { }

  ngOnInit() {
    this.shadowService.date$.subscribe((date) => {
      this.date = date;
    })
  }


  onDayChanged(day: Date) {
    this.shadowService.setDay(day);
  }


  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'c') {
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
