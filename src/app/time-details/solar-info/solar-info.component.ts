import {Component, OnInit} from '@angular/core';
import {ShadowCalculatorService} from "../../shadow-calculator.service";
import LatLng = google.maps.LatLng;

let SunCalc = require('suncalc');


@Component({
  selector: 'app-solar-info',
  templateUrl: './solar-info.component.html',
  styleUrls: ['./solar-info.component.css']
})
export class SolarInfoComponent implements OnInit {
  pos: LatLng;
  date: Date;
  private _sunrise: string | Date;
  private _sunset: string | Date;
  private _noon: string | Date;
  noonAltitudeDegrees: string;
  noonAzimuthDegrees: string;
  hours: number;
  minutes: number;


  midsummer: Date;
  midwinter: Date;


  constructor(private shadowService: ShadowCalculatorService) {
  }


  ngOnInit() {
    this.shadowService.pos$.subscribe(pos => {
      this.pos = pos;
      this.recalculateFields();
    });
    this.shadowService.date$.subscribe(date => {
      this.date = date;
      this.recalculateFields();
    });
  }

  private recalculateFields() {
    if (this.pos == null || this.date == null)
      return;
    const times = SunCalc.getTimes(this.date, this.pos.lat(), this.pos.lng());
    // const position = SunCalc.getPosition(this.date, this.pos.lat(), this.pos.lng());
    this._sunrise = times.sunrise;
    this._sunset = times.sunset;
    this._noon = times.solarNoon;

    const noonPosition = SunCalc.getPosition(times.solarNoon, this.pos.lat(), this.pos.lng());
    this.noonAltitudeDegrees = (noonPosition.altitude * (180 / Math.PI)).toFixed(0);
    this.noonAzimuthDegrees = (noonPosition.azimuth * (180 / Math.PI)).toFixed(0);

    const sunrisePosition = SunCalc.getPosition(times.sunrise, this.pos.lat(), this.pos.lng());
    const sunriseAzimuthDegrees = (sunrisePosition.azimuth * (180 / Math.PI)).toFixed(0);

    const sunsetPosition = SunCalc.getPosition(times.sunset, this.pos.lat(), this.pos.lng());
    const sunsetAzimuthDegrees = (sunsetPosition.azimuth * (180 / Math.PI)).toFixed(0);

    this.hours = (this._sunset as Date).getHours() - (this._sunrise as Date).getHours();
    this.minutes = (this._sunset as Date).getMinutes() - (this._sunrise as Date).getMinutes();

    this.calculateMidsummerAndMidwinter();


  }

  private calculateMidsummerAndMidwinter() {
// first day of year
    let temp = new Date(new Date().getFullYear(), 0, 1);
    let previousDayLong = null;
    let previousDateLong = null;

    let previousDayShort = null;
    let previousDateShort = null;
    for (let i = 0; i < 365; i++) {
      temp.setDate(temp.getDate() + 1);
      const times = SunCalc.getTimes(temp, this.pos.lat(), this.pos.lng());
      if (times.sunrise != null && times.sunset != null) {
        const tempDay = times.sunset.getTime() - times.sunrise.getTime();
        if (previousDayLong == null || previousDayLong < tempDay) {
          previousDayLong = tempDay;
          previousDateLong = new Date(temp);
        }
        if (previousDayShort == null || previousDayShort > tempDay) {
          previousDayShort = tempDay;
          previousDateShort = new Date(temp);
        }
      }
    }
    this.midsummer = previousDateLong;
    this.midwinter = previousDateShort;

    console.log("midsummer", this.midsummer);
    console.log("midwinter", this.midwinter);
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

  public get noon_altitude(): string {
    return this.formatTime(this.shadowService.noon);
  }

  private formatTime(time: any): string {
    if (time == null || time == "Invalid Date")
      return "";
    return time.getHours() + ':' + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes();
  }

  selectDate(date: Date) {
    this.shadowService.setDay(date);
  }

}
