import 'hammerjs';
import {Component, NgZone, ViewChild} from '@angular/core';
import {environment} from "../environments/environment";
import DrawingControlOptions = google.maps.drawing.DrawingControlOptions;
import OverlayType = google.maps.drawing.OverlayType;
import MarkerOptions = google.maps.MarkerOptions;
import {} from '@types/googlemaps';
import {colors} from "./shape/marker-set.model";
import {ShadowCalculatorService} from "./shadow-calculator.service";
import {ShadowShapeSet} from "./shape/shadow-shape.model";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  @ViewChild('gmap') gmapElement: any;
  map: google.maps.Map;
  shadowShapesSet: ShadowShapeSet;


  constructor(private _ngZone: NgZone, private shadowService: ShadowCalculatorService) {

  }

  ngOnInit() {
    let mapProp = {
      center: new google.maps.LatLng(environment.initLat, environment.initLng),
      zoom: 20,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      rotateControl: false,
      overviewMapControl: false,
      streetViewControl: false
    };


    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
    this.map.setTilt(0);
    this.shadowShapesSet = new ShadowShapeSet(this.map);
    this.shadowService.setShadowShapeSet(this.shadowShapesSet);


    const drawingControlOptions: DrawingControlOptions = {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [OverlayType.POLYGON]
    };
    const markerOptions: MarkerOptions = {
      icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
      position: new google.maps.LatLng(environment.initLat, environment.initLng)
    };
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions,
      markerOptions,
      polygonOptions: {
        fillColor: colors.colorArea,
        fillOpacity: 0.2,
        strokeWeight: 3,
        clickable: true,
        editable: true,
        draggable: true,
        zIndex: 1
      }
    });


    const shadowShapesSet = this.shadowShapesSet;

    google.maps.event.addListener(drawingManager, 'overlaycomplete', (e) => {
      if (e.type != google.maps.drawing.OverlayType.MARKER) {
        // Switch back to non-drawing mode after drawing a shape.
        drawingManager.setDrawingMode(null);

        shadowShapesSet.onShapeAdded(e.overlay, this._ngZone, this.shadowService);
      }
    });
    drawingManager.setMap(this.map);

  }


}
