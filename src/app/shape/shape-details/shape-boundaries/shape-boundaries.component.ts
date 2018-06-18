import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-shape-boundaries',
  templateUrl: './shape-boundaries.component.html',
  styleUrls: ['./shape-boundaries.component.css']
})
export class ShapeBoundariesComponent implements OnInit {

  pointSettings:PointSetting[] = [];
  constructor() { }

  ngOnInit() {
  }

  openShapeBoundariesPopup() {

  }
}


export interface PointSetting {
  constructor(length:number, angle:number )
}
