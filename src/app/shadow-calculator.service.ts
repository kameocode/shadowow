import {Injectable, NgZone} from '@angular/core';
import {ShadowShapeSet, ShadowVisualPreferences, ShapesJSON} from "./shape/shadow-shape.model";
import {BehaviorSubject} from 'rxjs';
import {SunPositionCalculator} from "./sun-position-calculator.model";
import LatLng = google.maps.LatLng;
import Map = google.maps.Map;

let SunCalc = require('suncalc');

// import SunCalc from 'suncalc';

@Injectable()
export class ShadowCalculatorService {
  private hour: number = new Date().getHours();
  private minutes: number = new Date().getMinutes();
  public shadowShapeSet: ShadowShapeSet;
  private date = new Date();


  public isDay: boolean;
  public isDuskOrDawn: boolean;
  public sunrise: Date;
  public sunset: Date;
  public noon: Date;

  public azimuthDegrees: number;
  public azimuthRad: number;

  public date$ = new BehaviorSubject<Date>(this.date);
  public pos$ = new BehaviorSubject<LatLng>(null);

  private sunIconPositionCalculator: SunPositionCalculator;

  public midsummer: Date;
  public midwinter: Date;

  public visualPreferences: ShadowVisualPreferences = {
    shadowStrokeWidth: 2,
    shadowFillColor: "#000000"
  };

  constructor() {

  }

  public init(map: Map, _ngZone: NgZone) {

    const prefString = localStorage.getItem('shadowVisualPreferences');
    try {
      if (prefString != null) {
        const temp = JSON.parse(prefString);
        Object.assign(this.visualPreferences, temp);
      }
    } catch (error) {
      // ignore error
    }


    this.shadowShapeSet = new ShadowShapeSet(map, _ngZone, this.visualPreferences);
  }

  public setTime(hour: number, minutes: number) {
    this.hour = hour;
    this.minutes = minutes;
    this.date.setHours(this.hour, this.minutes, 0, 0);
    this.date$.next(new Date(this.date));
    this.shadowShapeSet.clearSelection();
    this.recalculateShadows();
    this.recalculateSunPosition();
  }

  setDay(day: Date) {
    this.date = new Date(day);
    this.date.setHours(this.hour, this.minutes, 0, 0);
    this.date$.next(this.date);
    this.recalculateShadows();
    this.recalculateSunPosition();
  }

  public setDateAndTime(day: Date) {
    this.date = new Date(day);
    this.date$.next(this.date);
    this.hour = day.getHours();
    this.minutes = day.getMinutes();
    this.recalculateShadows();
    this.recalculateSunPosition();
  }

  public setDateAndTimeFromModel(model: ShapesJSON) {
    if (model.timestamp != null) {
      this.date = new Date(model.timestamp);
      this.hour = this.date.getHours();
      this.minutes = this.date.getMinutes();
      this.date$.next(this.date);
      this.recalculateShadows();
      this.recalculateSunPosition();
    }
  }

  public updateShadowPreferences() {
    try {
      localStorage.setItem('shadowVisualPreferences', JSON.stringify(this.visualPreferences));
    } catch (error) {
      // ignore error
    }
    this.recalculateShadows();
  }


  public recalculateShadows() {

    const center = this.shadowShapeSet.map.getCenter();
    const times = SunCalc.getTimes(this.date, center.lat(), center.lng());
    const position = SunCalc.getPosition(this.date, center.lat(), center.lng());
    const altitudeDegrees = position.altitude * (180 / Math.PI);
    const azimuthDegrees = position.azimuth * (180 / Math.PI);
    console.log("altitude=" + altitudeDegrees + " azimuth=" + azimuthDegrees);
    this.azimuthDegrees = azimuthDegrees;
    this.azimuthRad = position.azimuth;

    this.shadowShapeSet.createShadows(position.altitude, position.azimuth);
    this.isDay = position.altitude > 0;
    this.isDuskOrDawn = position.altitude > 0 && (this.date.getTime() < times.goldenHourEnd.getTime() || this.date.getTime() > times.goldenHour);

    this.sunrise = times.sunrise;
    this.sunset = times.sunset;
    this.noon = times.solarNoon;


  }

  public recalculateSunPosition() {
    const center = this.shadowShapeSet.map.getCenter();
    const times = SunCalc.getTimes(this.date, center.lat(), center.lng());
    const position = SunCalc.getPosition(this.date, center.lat(), center.lng());
    if (this.sunIconPositionCalculator == null) {
      this.sunIconPositionCalculator = new SunPositionCalculator(this.shadowShapeSet.map);
    }

    this.sunIconPositionCalculator.recalculatePositionOfSunIconOnTheMap(position.azimuth);
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

  registerMidsummerAndMidwinter(midsummer: Date, midwinter: Date) {
    this.midsummer = midsummer;
    this.midwinter = midwinter;

  }

  recalculateShape(index: number, distance: number, angle: number) {
    let calculatedLatLng = this.shadowShapeSet.currentShape.origin.getPath().getArray();
    let originalLatLng: LatLng[] = calculatedLatLng;
    let tempIndex = index + 1;
    if (index + 1 === originalLatLng.length) {
      tempIndex = 0;
    }
    let startLatLng = calculatedLatLng[index];
    calculatedLatLng[tempIndex] = google.maps.geometry.spherical.computeOffset(startLatLng, distance, angle);
    this.shadowShapeSet.currentShape.origin.setPath(calculatedLatLng);
    if (this.shadowShapeSet.currentShape != null) {
      this.shadowShapeSet.markersSet.createMarkers(this.shadowShapeSet.currentShape.origin, true);
    } else {
      this.shadowShapeSet.markersSet.clearMarkers();
    }
    this.recalculateShadows();
  }

  clearSelection() {
    this.shadowShapeSet.clearSelection();
  }
}
