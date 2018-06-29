import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import LatLng = google.maps.LatLng;



let SunCalc = require('suncalc');

@Component({
  selector: 'app-solar-info-column',
  templateUrl: './solar-info-column.component.html',
  styleUrls: ['./solar-info-column.component.css']
})
export class SolarInfoColumnComponent implements OnInit, OnChanges {

  @Input()
  date: Date;
  @Input()
  pos: LatLng;
  @Input()
  type: 'CUSTOM' | 'MIDSUMMER'| 'MIDWINTER';


  private sunriseDate: Date | null;
  private sunsetDate: Date | null;
  private noonDate: Date | null;

  noonAltitudeDegrees: string;
  sunriseAzimuthDegrees: string;
  sunsetAzimuthDegrees: string;


  constructor() { }

  ngOnInit() {
  }
  ngOnChanges(changes: SimpleChanges): void {

    const times = SunCalc.getTimes(this.date, this.pos.lat(), this.pos.lng());
    const position = SunCalc.getPosition(this.date, this.pos.lat(), this.pos.lng());


    this.sunriseDate = times.sunrise == "Invalid Date"? null: times.sunrise as Date;
    this.sunsetDate = times.sunset == "Invalid Date"? null: times.sunset as Date;
    this.noonDate = times.solarNoon == "Invalid Date"? null: times.noon as Date;

    const noonPosition = SunCalc.getPosition(times.solarNoon, this.pos.lat(), this.pos.lng());
    this.noonAltitudeDegrees = (noonPosition.altitude * (180 / Math.PI)).toFixed(0);

    if (this.sunriseDate == null) {
      this.sunriseAzimuthDegrees = "-";
    } else {
      const sunrisePosition = SunCalc.getPosition(times.sunrise, this.pos.lat(), this.pos.lng());
      this.sunriseAzimuthDegrees = (sunrisePosition.azimuth * (180 / Math.PI)).toFixed(0) ; //TODO direction?
    }

    if (this.sunsetDate == null) {
      this.sunsetAzimuthDegrees = "-";
    } else {
      const sunsetPosition = SunCalc.getPosition(times.sunset, this.pos.lat(), this.pos.lng());
      this.sunsetAzimuthDegrees = (sunsetPosition.azimuth * (180 / Math.PI)).toFixed(0) ; //TODO direction?
    }

  }



  get typeLabel() {
    switch (this.type) {
      case "CUSTOM":
        return "selected day";
      case "MIDSUMMER":
        return "summer solastice";
      case "MIDWINTER":
        return "winter solastice";
      default:
        return null;
    }

  }
  get iconUrl() {
    switch (this.type) {
      case "CUSTOM":
        return "assets/noon_selected.svg";
      case "MIDSUMMER":
        return "assets/noon_summer.svg";
      case "MIDWINTER":
        return "assets/noon_winter.svg";
      default:
        return null;
    }
  }

  get sunriseHour() {
    if (this.sunriseDate == null)
      return null;
    return  this.sunriseDate.getHours()+": "+this.sunriseDate.getMinutes()
  }
  get sunsetHour() {
    if (this.sunsetDate == null)
      return null;
    return  this.sunsetDate.getHours()+": "+this.sunsetDate.getMinutes()
  }

  get noonHour() {
    if (this.noonDate == null)
      return null;
    return  this.noonDate.getHours()+": "+this.noonDate.getMinutes()
  }

  get dayDuration() {
    if (this.sunriseDate == null || this.sunsetDate == null)
      return null;
    const hours = this.sunsetDate.getHours() - this.sunriseDate.getHours();
    const minutes = this.sunsetDate.getMinutes() - this.sunriseDate.getMinutes();
    return  hours+"h "+minutes+"m";
  }
}
