import {Injectable} from '@angular/core';
import {ShadowShapeSet, ShapesJSON} from "./shape/shadow-shape.model";
import {Subject} from "rxjs/Subject";

let SunCalc = require('suncalc');

// import SunCalc from 'suncalc';

@Injectable()
export class ShadowCalculatorService {
  private hour: number = 16;
  private minutes: number = 20;
  private shadowShapeSet: ShadowShapeSet;
  private date = new Date();


  public isDay: boolean;
  public isDuskOrDawn: boolean;
  public sunrise: Date;
  public sunset: Date;
  public noon: Date;

  public date$ = new Subject<Date>();

  constructor() {

  }

  public setTime(hour: number, minutes: number) {
    this.hour = hour;
    this.minutes = minutes;
    this.shadowShapeSet.clearSelection();
    this.recalculateShadows();
  }
  setDay(day: Date) {
    this.date = new Date(day);
    this.recalculateShadows();
  }
  public setDateAndTime(model: ShapesJSON) {
    if (model.timestamp != null) {
      this.date = new Date(model.timestamp);
      this.hour = this.date.getHours();
      this.minutes = this.date.getMinutes();
      this.date$.next(this.date);
    }
  }

  public setShadowShapeSet(shadowShapeSet: ShadowShapeSet) {
    this.shadowShapeSet = shadowShapeSet;
  }

  public recalculateShadows() {
    this.date.setHours(this.hour, this.minutes, 0, 0);
    const times = SunCalc.getTimes(/*Date*/ this.date, /*Number*/ this.shadowShapeSet.map.getCenter().lat(), /*Number*/ this.shadowShapeSet.map.getCenter().lng());
    const position = SunCalc.getPosition(/*Date*/ this.date, /*Number*/ this.shadowShapeSet.map.getCenter().lat(), /*Number*/ this.shadowShapeSet.map.getCenter().lng());
    const altitudeDegrees = position.altitude * (180 / Math.PI);
    const azimuthDegrees = position.azimuth * (180 / Math.PI);
    console.log("altitude=" + altitudeDegrees + " azimuth=" + azimuthDegrees);

    this.shadowShapeSet.createShadows(position.altitude, position.azimuth);
    this.isDay = position.altitude > 0;
    this.isDuskOrDawn = position.altitude> 0 && (this.date.getTime()<times.goldenHourEnd.getTime() || this.date.getTime()>times.goldenHour);

    this.sunrise = times.sunrise;
    this.sunset = times.sunset;
    this.noon = times.solarNoon;

  }

  getDate() {
    return this.date;
  }

  getMinutes() {
    return this.minutes;
  }

  getHour() {
    return this.hour;
  }

  setCurrentHeight(height: number) {
    this.shadowShapeSet.currentHeight = height;
  }
}
