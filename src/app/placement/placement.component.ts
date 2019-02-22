import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-placement',
  templateUrl: './placement.component.html',
  styleUrls: ['./placement.component.css']
})
export class PlacementComponent implements OnInit {
  placement: any = null;
  constructor() {
   /* const win = window as any;
    if (win.CHITIKA === undefined) { win.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"vinga","width":550,"height":250,"sid":"Chitika Default"};
    var placement_id = win.CHITIKA.units.length;
    win.CHITIKA.units.push(unit);
    this.placement = "chitikaAdBlock-"+placement_id+"";

    setTimeout(() => {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = "//cdn.chitika.net/getads.js";
      document.body.appendChild(script);
    }, 200);*/
  }

  ngOnInit() {
  }

}
