import {fromEventPattern} from "rxjs/index";
import {Observable} from 'rxjs';
import Map = google.maps.Map;

export function copyTextToClipboard(text) {
  const textArea = document.createElement("textarea");

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = '0';

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    const msg = successful ? 'successful' : 'unsuccessful';
  } catch (err) {
    console.log('Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
export function isSameDayOfYear(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();
}

export function googleMapObservable$(map: Map, listenerName: string): Observable<any> {
  return fromEventPattern(
    (handler) => {
      return map.addListener(listenerName, handler as any);
    },
    function (handler, listener) {
      google.maps.event.removeListener(listener);
    }
  );
}

export function isDeviceMobile() {
  return( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) );
}
