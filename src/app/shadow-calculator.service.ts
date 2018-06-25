import {Injectable} from '@angular/core';
import {ShadowShapeSet} from "./shape/shadow-shape.model";

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


    console.log("this is Day "+this.isDay);
  }


  getMinutes() {
    return this.minutes;
  }

  getHour() {
    return this.hour;
  }


}
