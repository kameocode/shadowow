import {Component, OnInit} from '@angular/core';
import {ShadowCalculatorService} from "../shadow-calculator.service";

@Component({
  selector: 'app-day-info',
  templateUrl: './day-info.component.html',
  styleUrls: ['./day-info.component.css']
})
export class DayInfoComponent implements OnInit {

  constructor(private shadowService: ShadowCalculatorService) {
  }

  ngOnInit() {

  }

  public get sunrise(): string {
    return this.formatTime(this.shadowService.sunrise);
  }

  public get sunset(): string {
    return this.formatTime(this.shadowService.sunset);
  }

  public get noon(): string {
    return this.formatTime(this.shadowService.noon);
  }

  formatTime(time: any): string {
    // console.log("time? ",time);
    if (time==null || time == "Invalid Date")
      return "";
    return time.getHours() + ':' + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes();
  }

}
