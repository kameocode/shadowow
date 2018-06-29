import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
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
  type: 'CUSTOM' | 'MIDSUMMER' | 'MIDWINTER';
  @Input()
  withNowAltitudeAndAzimuth: boolean = false;
  @Output()
  change = new EventEmitter<Date>();


  private sunriseDate: Date | null;
  private sunsetDate: Date | null;
  private noonDate: Date | null;

  noonAltitudeDegrees: string;
  sunriseAzimuthDegrees: string;
  sunsetAzimuthDegrees: string;

  nowAzimuthDegrees: string;
  nowAltitudeDegrees: string;


  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {

    const times = SunCalc.getTimes(this.date, this.pos.lat(), this.pos.lng());
    const position = SunCalc.getPosition(this.date, this.pos.lat(), this.pos.lng());
    this.nowAzimuthDegrees = this.getAzimuth(position);
    this.nowAltitudeDegrees = this.getAltitude(position);

    this.sunriseDate = times.sunrise == "Invalid Date" ? null : times.sunrise as Date;
    this.sunsetDate = times.sunset == "Invalid Date" ? null : times.sunset as Date;
    this.noonDate = times.solarNoon == "Invalid Date" ? null : times.solarNoon as Date;

    const noonPosition = SunCalc.getPosition(times.solarNoon, this.pos.lat(), this.pos.lng());
    this.noonAltitudeDegrees = this.getAltitude(noonPosition);

    if (this.sunriseDate == null) {
      this.sunriseAzimuthDegrees = "-";
    } else {
      const sunrisePosition = SunCalc.getPosition(times.sunrise, this.pos.lat(), this.pos.lng());
      this.sunriseAzimuthDegrees = this.getAzimuth(sunrisePosition);
    }

    if (this.sunsetDate == null) {
      this.sunsetAzimuthDegrees = "-";
    } else {
      const sunsetPosition = SunCalc.getPosition(times.sunset, this.pos.lat(), this.pos.lng());
      this.sunsetAzimuthDegrees = this.getAzimuth(sunsetPosition);
    }

  }

  public onDaySelected() {
    this.change.emit(this.date);
  }

  private getAltitude(position: any) {
    return (position.altitude * (180 / Math.PI)).toFixed(0);
  }

  private getAzimuth(position: any) { //TODO direction?
    return (-1 * (-180 - position.azimuth * (180 / Math.PI))).toFixed(0);
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

  get tooltip() {
    switch (this.type) {
      case "CUSTOM":
        return "selected";
      case "MIDSUMMER":
        return "summer solastice";
      case "MIDWINTER":
        return "winter solastice";
      default:
        return null;
    }
  }

  get sunriseHour() {
    if (this.sunriseDate == null)
      return null;
    return this.formatTime(this.sunriseDate);
  }

  get sunsetHour() {
    if (this.sunsetDate == null)
      return null;
    return this.formatTime(this.sunsetDate);
  }

  get noonHour() {
    if (this.noonDate == null)
      return null;
    return this.formatTime(this.noonDate);
  }

  get nowHour() {
    if (this.date == null)
      return null;
    return this.formatTime(this.date);
  }

  private formatTime(date: Date) {
    return ((date.getHours() < 10) ? "0" + date.getHours() : date.getHours()) + ":" +
      ((date.getMinutes() < 10) ? "0" + date.getMinutes() : date.getMinutes())
  }

  get dayDuration() {
    if (this.sunriseDate == null || this.sunsetDate == null)
      return null;
    const diff = Math.abs(this.sunsetDate.getTime() - this.sunriseDate.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = (diff - hours * (1000 * 60 * 60)) / (1000 * 60);


    return hours.toFixed(0) + "h " + minutes.toFixed(0) + "m";
  }
}
