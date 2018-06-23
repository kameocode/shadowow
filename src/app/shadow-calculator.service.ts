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
    const azimuth = position.azimuth;
    const altitude = position.altitude;

    const altitudeDegrees = position.altitude * (180 / Math.PI);
    const azimuthDegrees = position.azimuth * (180 / Math.PI);
    console.log("altitude=" + altitudeDegrees + " azimuth=" + azimuthDegrees);

    this.shadowShapeSet.createShadows(position.altitude, position.azimuth);


  }


  getMinutes() {
    return this.minutes;
  }

  getHour() {
    return this.hour;
  }


}
