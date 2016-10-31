// This code is used to implement dragging across all three platforms. Right
// now, -moz-window-dragging: drag is intended to replace WindowDraggingUtils.jsm
// but only on mac and windows (not linux). There is also a problem with
// -moz-window-dragging on Windows OS if the dragged window is chromeless (like
// the minvid window).
//
// The WindowDraggingElement exported by WindowDraggingUtils.jsm has two checks
// in the constructor that we need to avoid: a test that the platform isn't win
// or mac, and a test that the element made draggable is a panel.
// We also need to shim the missing `window.beginWindowMove` method that should
// be present, but isn't, on the minvid window on linux.

/* global WindowDraggingElement, AppConstants, Services, ostypes, ctypes */

const { Cu, Ci } = require('chrome');

const utils = require('./native-window-utils.js');

Cu.import('resource://gre/modules/AppConstants.jsm');
// WindowDraggingUtils exports WindowDraggingElement.
Cu.import('resource://gre/modules/WindowDraggingUtils.jsm');

// Imports needed for cutils stuff.
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/ctypes.jsm');
Cu.import('chrome://minvid-ostypes/content/cutils.jsm');
// If we're in linux, we will need ostypes.
const wm = Services.appinfo.widgetToolkit.toLowerCase();
if (wm.startsWith('gtk')) {
  Cu.import('chrome://minvid-ostypes/content/ostypes_x11.jsm');
}

// How to use: search for WindowDraggingElement in dxr :-)

// Makes an element draggable, like WindowDraggingElement, but without the
// "platform must not be win or mac" and "elem must be a panel" checks from the
// WindowDraggingElement constructor.
function DraggableElement(elem) {
  this._elem = elem;
  this._window = elem instanceof Ci.nsIDOMChromeWindow ? elem : elem.ownerDocument.defaultView;
  this._elem.addEventListener('mousedown', this, false);

  // Override some prototype methods without breaking the prototype.
  this.shouldDrag = shouldDrag;
  this._handleEvent = this.handleEvent;
  this.handleEvent = handleEvent;
}
// Take all the rest of the functionality of WindowDraggingElement.
DraggableElement.prototype = WindowDraggingElement.prototype;

// shouldDrag doesn't support starting a window drag from inside an iframe.
// Strip it down to its bare essentials.
function shouldDrag(aEvent) {
  return !this._window.fullScreen &&
    // Ensure the primary button was clicked
    aEvent.button === 0 &&
    this.mouseDownCheck.call(this._elem, aEvent) &&
    !aEvent.defaultPrevented &&
    // Only drag specific elements.
    // This check works for windows and mac.
    aEvent.target.classList.contains('drag');
}

// On linux, the WindowDraggingUtils.jsm code calls window.beginWindowMove, but
// that API isn't found on the minvid window for some reason.
// Since beginWindowMove just forwards the mouse event to the native window
// manager, just do that manually.
// For mac or windows, just call the existing function as usual.
function handleEvent(aEvent) {
  if (aEvent.type === 'mousedown' && /^gtk/i.test(AppConstants.MOZ_WIDGET_TOOLKIT)) {
    // Only drag specific elements. This check is needed for linux because the
    // shouldDrag method isn't called (for unknown reasons).
    // Also, don't drag the window if the button pressed isn't the primary button.
    if (!aEvent.target.classList.contains('drag') || aEvent.button !== 0) return;

    const winPtrStr = utils.getNativeHandlePtrStr(this._window);
    const gdkWin = ostypes.TYPE.GdkWindow.ptr(ctypes.UInt64(winPtrStr));
    // TODO: GDK docs say that button should be 0 if the drag is initiated by
    // the keyboard. Hard-coding the value to 1 might introduce an a11y bug.
    const button = 1;
    const coords = utils.getMouseInfo();
    const timestamp = ostypes.CONST.GDK_CURRENT_TIME;
    ostypes.API('gdk_window_begin_move_drag')(gdkWin, button, coords.x, coords.y, timestamp);
  }
  else this._handleEvent(aEvent);

  // TODO: this seems incorrect. experiment with the return value.
  // in general, we don't want the mousedown passed through to the iframe
  return true;
}

module.exports = DraggableElement;
