import {Component, ViewChild} from '@angular/core';
import DrawingControlOptions = google.maps.drawing.DrawingControlOptions;
import OverlayType = google.maps.drawing.OverlayType;
import MarkerOptions = google.maps.MarkerOptions;
import LatLng = google.maps.LatLng;
import {environment} from "../environments/environment";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  @ViewChild('gmap') gmapElement: any;
  map: google.maps.Map;
  title = 'shadowow';


  ngOnInit() {


    var mapProp = {
      center: new google.maps.LatLng(environment.initLat, environment.initLng),
      zoom: 100,
      mapTypeId: google.maps.MapTypeId.SATELLITE
    };


    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
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
      position: LatLng
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
    // this.map.addListener("polygoncomplete", new OnPolygonClickListener())
    drawingManager.setMap(this.map);

  }

  public loadScript() {
    var isFound = false;
    var scripts = document.getElementsByTagName("script") as any
    for (var i = 0; i < scripts.length; ++i) {
      if (scripts[i].getAttribute('src') != null && scripts[i].getAttribute('src').includes("loader")) {
        isFound = true;
      }
    }

    if (!isFound) {
      var dynamicScripts = ["https://widgets.skyscanner.net/widget-server/js/loader.js"];

      for (var i = 0; i < dynamicScripts .length; i++) {
        let node = document.createElement('script');
        node.src = dynamicScripts [i];
        node.type = 'text/javascript';
        node.async = false;
        node.charset = 'utf-8';
        document.getElementsByTagName('head')[0].appendChild(node);
      }

    }
  }
  /*
  function remove_circle(circle) {
    // remove event listers
    google.maps.event.clearListeners(circle, 'click_handler_name');
    google.maps.event.clearListeners(circle, 'drag_handler_name');
    circle.setRadius(0);
    // if polygon:
    // polygon_shape.setPath([]);
    circle.setMap(null);
  }*/
}
