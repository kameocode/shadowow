import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ShadowCalculatorService} from "../../shadow-calculator.service";
import LatLng = google.maps.LatLng;

let SunCalc = require('suncalc');


@Component({
  selector: 'app-day-info',
  templateUrl: './day-info.component.html',
  styleUrls: ['./day-info.component.css']
})
export class DayInfoComponent implements OnInit, OnChanges {
  @Input()
  private date: Date;
  private latLng: LatLng;
  private offsetTop=40;
  private offsetLeft=23;
  private sunImg = new Image();
  private sunImgSunrise = new Image();
  private buttonPressed = false;

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
  /* this.shadowService.date$.subscribe((date: Date) => {
      this.date = date;
      this.onInputChanged();
    });*/
    this.sunImg.src = "assets/noon_small.svg"; //"assets/wb_sunny.svg";
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
    var rect = canvas.getBoundingClientRect();
    const mousePos = {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
    const x = mousePos.x;
    const y = mousePos.y;
    const diff = this.getDiff(canvas);

    let hour = (Math.max(0,x - this.offsetLeft)) / diff;
    const hourInMinutes = hour * 60;
    let minutes = hourInMinutes - Math.floor(hour) * 60;
    console.log("hour "+hour+" "+minutes);

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


    var canvas = document.getElementById("canv") as any;

    const ch = canvas.height - 2*this.offsetTop;
    const diff = this.getDiff(canvas);

    var ctx = canvas.getContext("2d");
    let d = new Date(this.date);
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    ctx.fillStyle="#000000";


    for (let i = 0; i < 24; i++) {
      d.setHours(i);
      d.setMinutes(0);
      const times = SunCalc.getTimes(d, this.latLng.lat(), this.latLng.lng());
      const position = SunCalc.getPosition(d, this.latLng.lat(), this.latLng.lng());
      const altitudeDegrees = position.altitude * (180 / Math.PI);


      ctx.fillRect(this.getHourOffset(d, canvas, diff), this.offsetTop+ 90 - (altitudeDegrees), 3, 3);

    }

    // draw sunrise
  /*  {
      d = new Date(this.shadowService.sunrise);
      const times = SunCalc.getTimes(d, this.latLng.lat(), this.latLng.lng());
      const position = SunCalc.getPosition(d, this.latLng.lat(), this.latLng.lng());
      const altitudeDegrees = position.altitude * (180 / Math.PI);
      const imgSize = 30;
      ctx.drawImage(this.sunImgSunrise, this.getHourOffset(d, diff)+this.offsetLeft - imgSize / 2, this.offsetTop+90 - altitudeDegrees - imgSize / 2, imgSize, imgSize);

    }*/


    // draw sun
    d = new Date(this.date);
    const times = SunCalc.getTimes(d, this.latLng.lat(), this.latLng.lng());
    const altitudeDegrees = this.getAltitude(d);
    const imgSize = 50;
    const sunX=this.getHourOffset(d, canvas, diff) - imgSize / 2;
    const sunY=this.offsetTop+90 - altitudeDegrees - imgSize / 2;
    ctx.drawImage(this.sunImg, sunX, sunY, imgSize, imgSize);



    // draw night
    var grd = ctx.createLinearGradient(0, 0, 170, 0);
    grd.addColorStop(0, "#1DC8CD"); //"#d5d5d5"
    grd.addColorStop(1, "#16EAD6");
    ctx.fillStyle = grd;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, this.offsetTop+90, canvas.width, ch);
    ctx.globalAlpha = 1;

    // draw sun current hour
    ctx.fillStyle = "#000000";
    ctx.font = "16px \"-apple-system\", \"BlinkMacSystemFont\", \"Segoe UI\", \"Roboto\", \"Helvetica Neu\"";
    ctx.textAlign="center";
    ctx.fillText(this.formatTime(d), sunX+imgSize/2, sunY+70);




    const noonX = this.getHourOffset(this.shadowService.noon, canvas, diff);
    let sunsetX = this.getHourOffset(this.shadowService.sunset, canvas, diff);
    let sunriseX = this.getHourOffset(this.shadowService.sunrise, canvas, diff);


    const spaceX = 50;
    if (sunsetX-noonX<spaceX) {
      sunsetX = noonX+spaceX;
    }
    if (noonX-sunriseX<spaceX) {
      sunriseX = noonX-spaceX;
    }

    ctx.fillText(this.noon, noonX, this.offsetTop-20);
    ctx.fillText(this.sunset, sunsetX, this.offsetTop-20);
    ctx.fillText(this.sunrise, sunriseX, this.offsetTop-20);

    ctx.font = "12px \"-apple-system\", \"BlinkMacSystemFont\", \"Segoe UI\", \"Roboto\", \"Helvetica Neu\"";
    ctx.fillText(this.getAltitude(this.shadowService.noon).toFixed(0)+" "+String.fromCharCode(176), noonX, this.offsetTop-8);
    ctx.fillText(this.getAltitude(d).toFixed(0)+" "+String.fromCharCode(176), sunX+imgSize/2, sunY+70+12);

    ctx.fillStyle = "#000000";
  }

  private getAltitude(d: Date) {
    const position = SunCalc.getPosition(d, this.latLng.lat(), this.latLng.lng());
    const altitudeDegrees = position.altitude * (180 / Math.PI);
    return altitudeDegrees;
  }

  private getDiff(canvas: any) {
    const cw = canvas.width - 2 * this.offsetLeft;
    const diff = cw / 24;
    return diff;
  }

  private getHourOffset(d: Date, canvas: any, diff: number) {

    const h = d.getHours() * 60;
    const m = d.getMinutes();
    const res = (h + m) / 60 * diff;
    return res+this.offsetLeft; //canvas.width-res-2*this.offsetLeft;
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

  formatTime(time: any): string {
    if (time == null || time == "Invalid Date")
      return "";
    return time.getHours() + ':' + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes();
  }

}
