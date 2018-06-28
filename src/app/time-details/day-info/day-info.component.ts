import {Component, HostListener, Input, OnChanges, OnInit} from '@angular/core';
import {ShadowCalculatorService} from "../../shadow-calculator.service";
import LatLng = google.maps.LatLng;
import {OutletContext} from "@angular/router";

let SunCalc = require('suncalc');


@Component({
  selector: 'app-day-info',
  templateUrl: './day-info.component.html',
  styleUrls: ['./day-info.component.css']
})
export class DayInfoComponent implements OnInit, OnChanges {
  private readonly offsetTop=40;
  private readonly offsetLeft=23;
  private readonly sunImg = new Image();
  private readonly sunImgFocused = new Image();
  private readonly sunImgSunrise = new Image();
  private readonly sunImgSize = 50;

  @Input()
  private date: Date;
  private latLng: LatLng;
  private buttonPressed = false;
  private sunFocued = false;

  constructor(private shadowService: ShadowCalculatorService) {
  }

  ngOnChanges() {
    this.onInputChanged();
  }

  ngOnInit() {
    this.shadowService.pos$.subscribe((latLng: LatLng) => {
      this.latLng = latLng;
      this.onInputChanged();
    });
    this.sunImg.src = "assets/noon_small.svg"; //"assets/wb_sunny.svg";
    this.sunImgFocused.src = "assets/noon_small_focused.svg"; //"assets/wb_sunny.svg";
    this.sunImgSunrise.src = "assets/sunrise_small.svg";

    this.sunImg.addEventListener('load', ()=>{
      // we need to have proper width and height
      this.onInputChanged();
    }, false);

    const canvas = document.getElementById("canv");
    canvas.addEventListener('mousedown', () => {
        this.buttonPressed = true;
    });
    canvas.addEventListener('mouseup', () => {
      this.buttonPressed = false;
    });
    canvas.addEventListener('mouseout', () => {
      this.buttonPressed = false;
    });
    canvas.addEventListener('mouseenter', (e) => {
     this.buttonPressed = e.buttons === undefined
        ? e.which === 1
        : e.buttons === 1;
    });
    canvas.addEventListener('mousemove', (evt) => {
      if (!this.buttonPressed) {
        return;
      }
      this.updateSunPosition(canvas, evt);
    }, false);
    canvas.addEventListener('click', (evt) => {
      this.updateSunPosition(canvas, evt);
    });
  }



  private updateSunPosition(canvas: any, evt) {
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    const hourSpanPixels = this.getXSpanPixels(canvas);

    let hour = (Math.max(0,x - this.offsetLeft)) / hourSpanPixels;
    const hourInMinutes = hour * 60;
    let minutes = hourInMinutes - Math.floor(hour) * 60;
    if (hour>=24) {
      hour = 23;
      minutes = 59;
    }
    this.date.setHours( Math.floor(hour));
    this.date.setMinutes(minutes);
    this.onInputChanged();
    this.shadowService.setDateAndTime(this.date);
  }

  private onInputChanged() {
    if (this.latLng == null || this.date == null) {
      return;
    }

    const canvas = document.getElementById("canv") as any;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);



    this.drawAltitudeFor24h(canvas, ctx);
    const sunPos = this.drawSun(canvas, ctx);
    this.drawNight(ctx, canvas);
    const noonX = this.drawSunriseNoonAndSunsetLabels(canvas, ctx);

    ctx.font = "12px \"-apple-system\", \"BlinkMacSystemFont\", \"Segoe UI\", \"Roboto\", \"Helvetica Neu\"";
    ctx.fillText(this.getAltitudeInDegrees(this.shadowService.noon).toFixed(0)+" "+String.fromCharCode(176), noonX, this.offsetTop-8);
    ctx.fillText(this.getAltitudeInDegrees(sunPos.date).toFixed(0)+" "+String.fromCharCode(176), sunPos.sunX+this.sunImgSize/2, sunPos.sunY+70+12);
    // ctx.fillText(this.getAzimuthInDegrees(d).toFixed(0)+" "+String.fromCharCode(176), sunX+imgSize/2, sunY+70+12+12);


  }


  private drawSunriseNoonAndSunsetLabels(canvas: any, ctx: any) {
    ctx.fillStyle="#000000";
    const hourSpan = this.getXSpanPixels(canvas);
    const noonX = this.getHourOffset(this.shadowService.noon, hourSpan);
    let sunsetX = this.getHourOffset(this.shadowService.sunset, hourSpan);
    let sunriseX = this.getHourOffset(this.shadowService.sunrise, hourSpan);
    const spaceX = 50; // margin to avoid text overlapping
    if (sunsetX - noonX < spaceX) {
      sunsetX = noonX + spaceX;
    }
    if (noonX - sunriseX < spaceX) {
      sunriseX = noonX - spaceX;
    }

    const upperTextPosY = this.offsetTop - 20;
    ctx.fillText(this.noon, noonX, upperTextPosY);
    ctx.fillText(this.sunset, sunsetX, upperTextPosY);
    ctx.fillText(this.sunrise, sunriseX, upperTextPosY);
    return noonX;
  }

  private drawNight(ctx: any, canvas: any) {
    var grd = ctx.createLinearGradient(0, 0, 190, 190);
    grd.addColorStop(0, "#1DC8CD"); //"#d5d5d5"
    grd.addColorStop(1, "#16EAD6");
    ctx.fillStyle = grd;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, this.offsetTop + 90 * this.getYSpanPixels(canvas), canvas.width, canvas.height - 2 * this.offsetTop);
    ctx.globalAlpha = 1;
  }

  private drawSun(canvas: any, ctx: any) {
    const height = (canvas.height - this.offsetTop)/2;
    const hourSpan = this.getXSpanPixels(canvas);
    const imgSize = this.sunImgSize;
    let d = new Date(this.date);
    const times = SunCalc.getTimes(d, this.latLng.lat(), this.latLng.lng());
    const altitudeDegrees = this.getAltitudeInDegrees(d)*this.getYSpanPixels(canvas);
    const sunX=this.getHourOffset(d, hourSpan) - imgSize / 2;
    const sunY=this.offsetTop+height - altitudeDegrees - imgSize / 2;
    if (!this.sunFocued)
      ctx.drawImage(this.sunImg, sunX, sunY, imgSize, imgSize);
    else
      ctx.drawImage(this.sunImgFocused, sunX, sunY, imgSize, imgSize);

    // draw sun current hour
    ctx.fillStyle = "#000000";
    ctx.font = "16px \"-apple-system\", \"BlinkMacSystemFont\", \"Segoe UI\", \"Roboto\", \"Helvetica Neu\"";
    ctx.textAlign="center";
    ctx.fillText(this.formatTime(d), sunX+imgSize/2, sunY+70);

    return {date: d, sunX, sunY, imgSize}
  }
  private drawAltitudeFor24h(canvas: any, ctx: any) {
    const height = (canvas.height - this.offsetTop)/2;
    const hourSpan = this.getXSpanPixels(canvas);
    ctx.fillStyle="#000000";
    for (let i = 0; i < 24; i++) {
      let d = new Date(this.date);
      d.setHours(i);
      d.setMinutes(0);
      const times = SunCalc.getTimes(d, this.latLng.lat(), this.latLng.lng());
      const position = SunCalc.getPosition(d, this.latLng.lat(), this.latLng.lng());
      const altitudeDegrees = position.altitude * (180 / Math.PI) * this.getYSpanPixels(canvas);
      ctx.fillRect(this.getHourOffset(d, hourSpan), this.offsetTop + height - (altitudeDegrees), 2, 2);
    }
  }


  private getAltitudeInDegrees(d: Date) {
    const position = SunCalc.getPosition(d, this.latLng.lat(), this.latLng.lng());
    const altitudeDegrees = position.altitude * (180 / Math.PI);
    return altitudeDegrees;
  }
  private getAzimuthInDegrees(d: Date) {
    const position = SunCalc.getPosition(d, this.latLng.lat(), this.latLng.lng());
    const azimuthDegrees = position.azimuth * (180 / Math.PI);
    return azimuthDegrees;
  }
  private getXSpanPixels(canvas: any) {
    const cw = canvas.width - 2 * this.offsetLeft;
    return cw / 24; //2ltitude is 4 hours
  }
  private getYSpanPixels(canvas: any) {
    const cw = canvas.height - 1 * this.offsetTop;
    return cw / 180; // a<-90;90>
  }
  private getHourOffset(d: Date, diff: number) {
    const h = d.getHours() * 60;
    const m = d.getMinutes();
    const res = (h + m) / 60 * diff;
    return res+this.offsetLeft;
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

  private formatTime(time: any): string {
    if (time == null || time == "Invalid Date")
      return "";
    return time.getHours() + ':' + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes();
  }

  increment() {
    this.date.setTime(this.date.getTime()+1000*60*10);

    this.updateHour();


  }
  decrement() {
    this.date.setTime(this.date.getTime()-1000*60*10);
    this.updateHour();

  }
  private updateHour() {

    this.shadowService.setDateAndTime(this.date);
  }


  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'b')
      this.decrement();
    else if (event.key === 'n')
      this.increment();
  }

}
