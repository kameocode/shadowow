import {Component, ViewChild} from '@angular/core';
import {environment} from "../environments/environment";
import DrawingControlOptions = google.maps.drawing.DrawingControlOptions;
import OverlayType = google.maps.drawing.OverlayType;
import MarkerOptions = google.maps.MarkerOptions;
import {} from '@types/googlemaps';
import {MarkersSet, ShadowShape, ShadowShapeSet} from "./MarkersSet";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  @ViewChild('gmap') gmapElement: any;
  map: google.maps.Map;
  title = 'shadowow';
  shadowShapesSet: ShadowShapeSet;


  ngOnInit() {
    var selectedShape;
    var selectedColor;
    var colors = ['#1E90FF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];

    var mapProp = {
      center: new google.maps.LatLng(environment.initLat, environment.initLng),
      zoom: 100,
      mapTypeId: google.maps.MapTypeId.SATELLITE
    };


    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
    this.shadowShapesSet = new ShadowShapeSet(this.map);
    const fmap = this.map;
    this.map.addListener('center_changed', function () {
      // 3 seconds after the center of the map has changed, pan back to the
      // marker.
      console.log(fmap.getCenter().lat() + " " + fmap.getCenter().lng())


    });
    const drawingControlOptions: DrawingControlOptions = {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [OverlayType.RECTANGLE, OverlayType.POLYGON, OverlayType.POLYLINE]
    };
    const markerOptions: MarkerOptions = {
      icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
      position: new google.maps.LatLng(environment.initLat, environment.initLng)
    };
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.MARKER,
      drawingControl: true,
      drawingControlOptions,
      markerOptions,
      polygonOptions: {
        fillColor: '#ffff00',
        fillOpacity: 0.2,
        strokeWeight: 3,
        clickable: true,
        editable: true,
        draggable: true,
        zIndex: 1
      }
    });


    const shadowShapesSet = this.shadowShapesSet;

    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
      if (e.type != google.maps.drawing.OverlayType.MARKER) {
        // Switch back to non-drawing mode after drawing a shape.
        drawingManager.setDrawingMode(null);

        shadowShapesSet.onShapeAdded(e.overlay);
      }
    });
    drawingManager.setMap(this.map);

  }


}
