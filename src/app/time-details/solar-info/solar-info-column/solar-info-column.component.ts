import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {isSameDayOfYear} from "../../../utils";
import LatLng = google.maps.LatLng;


let SunCalc = require('suncalc');

@Component({
  selector: 'app-solar-info-column',
  templateUrl: './solar-info-column.component.html',
  styleUrls: ['./solar-info-column.component.scss']
})
export class SolarInfoColumnComponent implements OnInit, OnChanges {

  @Input()
  date: Date;
  @Input()
  pos: LatLng;
  @Input()
  type: 'CUSTOM' | 'MIDSUMMER' | 'MIDWINTER' | 'TODAY';
  @Input()
  withNowAltitudeAndAzimuth: boolean = false;
  @Input()
  selectedDate: Date;
  @Input()
  detailed: boolean;
  @Input()
  modeButton: boolean;

  private _nowDate: Date;

  @Input()
  activeStateEnabled: boolean = true;

  @Output()
  change = new EventEmitter<Date>();

  @Output()
  changeWithTime = new EventEmitter<Date>();

  private sunriseDate: Date | null;
  private sunsetDate: Date | null;
  private noonDate: Date | null;

  noonAltitudeDegrees: string;
  noonAzimuthDegrees: string;
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

    this._nowDate = new Date(this.date);
    this._nowDate.setHours(this.selectedDate.getHours());
    this._nowDate.setMinutes(this.selectedDate.getMinutes());
    const nowPosition = SunCalc.getPosition(this._nowDate, this.pos.lat(), this.pos.lng());


    this.nowAzimuthDegrees = this.getAzimuth(nowPosition);
    this.nowAltitudeDegrees = this.getAltitude(nowPosition);

    this.sunriseDate = times.sunrise == "Invalid Date" ? null : times.sunrise as Date;
    this.sunsetDate = times.sunset == "Invalid Date" ? null : times.sunset as Date;
    this.noonDate = times.solarNoon == "Invalid Date" ? null : times.solarNoon as Date;

    const noonPosition = SunCalc.getPosition(times.solarNoon, this.pos.lat(), this.pos.lng());
    this.noonAltitudeDegrees = this.getAltitude(noonPosition);
    this.noonAzimuthDegrees = this.getAzimuth(noonPosition);

    if (this.sunriseDate == null) {
      this.sunriseAzimuthDegrees = null;
    } else {
      const sunrisePosition = SunCalc.getPosition(times.sunrise, this.pos.lat(), this.pos.lng());
      this.sunriseAzimuthDegrees = this.getAzimuth(sunrisePosition);
    }

    if (this.sunsetDate == null) {
      this.sunsetAzimuthDegrees = null;
    } else {
      const sunsetPosition = SunCalc.getPosition(times.sunset, this.pos.lat(), this.pos.lng());
      this.sunsetAzimuthDegrees = this.getAzimuth(sunsetPosition);
    }

  }

  selectSunrise() {
    if (this.sunriseDate != null) {
      this.changeWithTime.emit(this.sunriseDate);
    }
  }

  selectSunset() {
    if (this.sunsetDate != null) {
      this.changeWithTime.emit(this.sunsetDate);
    }
  }

  selectSolarNoon() {
    if (this.noonDate != null) {
      this.changeWithTime.emit(this.noonDate);
    }
  }

  selectNow() {
    if (this.type == "CUSTOM") {
      this.changeWithTime.emit(new Date());
    } else {
      this.changeWithTime.emit(this._nowDate);
    }
  }

  incrementDay() {
    this.date.setTime(this.date.getTime() + 1000 * 60 * 60 * 24);
    this.change.emit(this.date);
  }

  decrementDay() {
    this.date.setTime(this.date.getTime() - 1000 * 60 * 60 * 24);
    this.change.emit(this.date);
  }

  public onDaySelected() {
    this.change.emit(this.date);
  }


  onDayChanged(day: Date) {
    this.date = day;
    this.change.emit(day);
  }

  private getAltitude(position: any) {
    return (position.altitude * (180 / Math.PI)).toFixed(0)+'°';
  }

  private getAzimuth(position: any) { //TODO direction?
    return (-1 * (-180 - position.azimuth * (180 / Math.PI))).toFixed(0)+'°';
  }

  get typeLabel() {
    switch (this.type) {
      case "CUSTOM":
        return "selected day";
      case "TODAY":
        return "today";
      case "MIDSUMMER":
        return "midsummer"; //"summer solastice";
      case "MIDWINTER":
        return "midwinter"; //"winter solastice";
      default:
        return null;
    }

  }

  get iconUrl() {
    switch (this.type) {
      case "CUSTOM":
        return "assets/noon_selected.svg";
      case "TODAY":
        return "assets/sun_today.svg";
      case "MIDSUMMER":
        return "assets/midsummer.svg";
      case "MIDWINTER":
        return "assets/midwinter.svg";
      default:
        return null;
    }
  }

  get tooltip() {
    switch (this.type) {
      case "CUSTOM":
        return "selected";
      case "TODAY":
        return "today";
      case "MIDSUMMER":
        return "summer solastice";
      case "MIDWINTER":
        return "winter solastice";
      default:
        return null;
    }
  }

  get opaque() {
    return this.type == "CUSTOM";
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
    if (this.selectedDate == null)
      return null;
    return this.formatTime(this._nowDate);
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

  public get active() {
    return this.isSameDay(this.date, this.selectedDate) && this.activeStateEnabled;
  }

  private isSameDay(d1: Date, d2: Date) {
    if (d1 == null || d2 == null)
      return false;
    return isSameDayOfYear(d1, d2)
  }
}
