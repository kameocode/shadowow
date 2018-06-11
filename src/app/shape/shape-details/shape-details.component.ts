import {Component, Input, OnInit} from '@angular/core';
import {ShadowShape} from "../shadow-shape.model";

@Component({
  selector: 'app-shape-details',
  templateUrl: './shape-details.component.html',
  styleUrls: ['./shape-details.component.css']
})
export class ShapeDetailsComponent implements OnInit {
  @Input()
  shadowShape: ShadowShape;

  constructor() {
  }


  ngOnInit() {
  }

  trackByIdx(index: number, obj: any): any {
    return index;
  }

}
