import { Component, OnInit } from '@angular/core';
import LatLng = google.maps.LatLng;
import {ShadowCalculatorService} from "../../shadow-calculator.service";

@Component({
  selector: 'app-current-day',
  templateUrl: './current-day.component.html',
  styleUrls: ['./current-day.component.css']
})
export class CurrentDayComponent implements OnInit {
  pos: LatLng;
  date: Date;

  constructor(private shadowService: ShadowCalculatorService) {
  }


  ngOnInit() {
    this.shadowService.pos$.subscribe(pos => {
      this.pos = pos;
    });
    this.shadowService.date$.subscribe(date => {
      this.date = date;
    });
  }

  selectDate(date: Date) {
    this.shadowService.setDay(date);
  }
  selectDateWithTime(date: Date) {
    this.shadowService.setDateAndTime(date);
  }
}
