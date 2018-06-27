import {Injectable} from '@angular/core';
import {ShadowShapeSet, ShapesJSON} from "./shape/shadow-shape.model";
import {Subject} from "rxjs/Subject";
import LatLng = google.maps.LatLng;
import {BehaviorSubject} from "rxjs/BehaviorSubject";

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

  public date$ = new BehaviorSubject<Date>(this.date);
  public pos$ = new BehaviorSubject<LatLng>(null);

  constructor() {

  }

  public setTime(hour: number, minutes: number) {
    this.hour = hour;
    this.minutes = minutes;
    this.date.setHours(this.hour, this.minutes, 0, 0);
    this.date$.next(new Date(this.date));
    this.shadowShapeSet.clearSelection();
    this.recalculateShadows();
  }
  setDay(day: Date) {
    this.date = new Date(day);
    this.date.setHours(this.hour, this.minutes, 0, 0);
    this.date$.next(this.date);
    this.recalculateShadows();
  }
  public setDateAndTime(day: Date) {
    this.date = new Date(day);
    this.date$.next(this.date);
    this.hour=day.getHours();
    this.minutes=day.getMinutes();
    this.recalculateShadows();
  }
  public setDateAndTimeFromModel(model: ShapesJSON) {
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

    const center = this.shadowShapeSet.map.getCenter();
    const times = SunCalc.getTimes(this.date, center.lat(), center.lng());
    const position = SunCalc.getPosition(this.date, center.lat(), center.lng());
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

  setPosition(pos: LatLng) {
    this.pos$.next(pos);
  }
}
