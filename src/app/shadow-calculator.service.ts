import {Injectable} from '@angular/core';
import {ShadowShapeSet} from "./shape/shadow-shape.model";

let SunCalc = require('suncalc');

// import SunCalc from 'suncalc';

@Injectable()
export class ShadowCalculatorService {
  private hour: number = 15;
  private minutes: number = 0;
  private shadowShapeSet: ShadowShapeSet;
  private date = new Date();

  constructor() {
  }

  public setHour(hour: number, minutes: number) {
    this.hour = hour;
    this.minutes = minutes;
    this.recalculateShadows();
  }

  public setShadowShapeSet(shadowShapeSet: ShadowShapeSet) {
    this.shadowShapeSet = shadowShapeSet;
  }

  public recalculateShadows() {
    console.log("recalculate", SunCalc);
    this.date.setHours(this.hour, this.minutes, 0, 0);
    const times = SunCalc.getTimes(/*Date*/ this.date, /*Number*/ this.shadowShapeSet.map.getCenter().lat(), /*Number*/ this.shadowShapeSet.map.getCenter().lng());
    const position = SunCalc.getPosition(/*Date*/ this.date, /*Number*/ this.shadowShapeSet.map.getCenter().lat(), /*Number*/ this.shadowShapeSet.map.getCenter().lng());
    console.log("times", times);
    console.log("position", position);
    //{azimuth: 1.0130491377558277, altitude: 0.8980476366408194}
    const azimuth = position.azimuth;
    const altitude = position.altitude;

    const altitudeDegrees = position.altitude * (180 / Math.PI);
    const azimuthDegrees = position.azimuth * (180 / Math.PI);
    console.log("altitude=" + altitudeDegrees + " azimuth=" + azimuthDegrees);

    const height = 10;
    const shadowLength = height / Math.tan(position.altitude);
    console.log("shadow length " + shadowLength + " " + Math.tan(position.altitude) + " " + altitudeDegrees);


    this.shadowShapeSet.createShadows(position.altitude, position.azimuth);


  }


  getMinutes() {
    return this.minutes;
  }

  getHour() {
    return this.hour;
  }
}
