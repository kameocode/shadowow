import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ShadowShape} from "../../MarkersSet";

@Component({
  selector: 'app-shape-details',
  templateUrl: './shape-details.component.html',
  styleUrls: ['./shape-details.component.css']
})
export class ShapeDetailsComponent implements OnInit {
  @Input()
  shadowShape:ShadowShape;
  foo = 2


  constructor() { }


  ngOnInit() {
  }

  trackByIdx(index: number, obj: any): any {
    return index;
  }

}
