import {Component, Input, OnInit} from '@angular/core';
import {ShadowShape} from "../shadow-shape.model";
import {ShadowCalculatorService} from "../../shadow-calculator.service";

@Component({
  selector: 'app-shape-details',
  templateUrl: './shape-details.component.html',
  styleUrls: ['./shape-details.component.css']
})
export class ShapeDetailsComponent implements OnInit {
  @Input()
  shadowShape: ShadowShape;

  constructor(private shadowService: ShadowCalculatorService) {
  }


  ngOnInit() {
  }

  trackByIdx(index: number, obj: any): any {
    return index;
  }

  onHeightChanged(height: number) {
      this.shadowService.recalculateShadows();
  }

}
