/* global Services, cutils, ostypes */

// Don't bother replacing instances of 'var' in copy-pasted code.
/* eslint-disable no-var */ 

const { Cu, Ci } = require('chrome');
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/ctypes.jsm');
Cu.import('chrome://minvid-ostypes/content/cutils.jsm');

// Load ostypes when linux is the platform.
let GTK_VERSION;
if (Services.appinfo.widgetToolkit.toLowerCase().startsWith('gtk')) {
  Cu.import('chrome://minvid-ostypes/content/ostypes_x11.jsm');
  // The gtk version is the last char: either 'gtk2' or 'gtk3'.
  GTK_VERSION = Services.appinfo.widgetToolkit.slice(-1);
}

// Given an nsIDOMWindow, return a string pointer to the native window.
function getNativeHandlePtrStr(domWindow) {
  const baseWindow = domWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                      .getInterface(Ci.nsIWebNavigation)
                      .QueryInterface(Ci.nsIDocShellTreeItem)
                      .treeOwner
                      .QueryInterface(Ci.nsIInterfaceRequestor)
                      .getInterface(Ci.nsIBaseWindow);
  return baseWindow.nativeHandle;
}

// Get native mouse event info on linux. By default, just returns x, y coords.
// Copied from https://github.com/Noitidart/ostypes_playground/blob/6f0c6039/bootstrap.js
function getMouseInfo(aOptions={}) {
  // by default it just returns x, y of mousedown
  const OPTIONS_DEFAULT = {
    mods: false
  };

  // GDK
  const MASKNAME = ['SHIFT', 'LOCK', 'CONTROL', 'MOD1', 'MOD2', 'MOD3', 'MOD4', 'MOD5', 'BUTTON1', 'BUTTON2', 'BUTTON3', 'BUTTON4', 'BUTTON5', 'SUPER', 'HYPER', 'META', 'RELEASE', 'MODIFIER'];

  aOptions = Object.assign(OPTIONS_DEFAULT, aOptions);

  var x = ostypes.TYPE.gint();
  var y = ostypes.TYPE.gint();
  var masks = aOptions.mods ? ostypes.TYPE.GdkModifierType() : null;

  if (GTK_VERSION < 3) {
    // use GTK2 method
    // eslint-disable-next-line no-unused-vars
    var gdkwinptr_undermouse = ostypes.API('gdk_window_get_pointer')(ostypes.API('gdk_get_default_root_window')(), x.address(), y.address(), aOptions.mods ? masks.address() : null);
  } else {
    // use GTK3 method
    var dispptr = ostypes.API('gdk_display_get_default')();

    // get pointer_device_ptr
    var pointer_device_ptr;
    try {
      // try GTK3
      // will throw `Error: couldn't find function symbol in library  ostypes_x11.jsm:2981:11` if it is deprecated, meaning user is on GTK3.2 and not GTK3
      var devmgrptr = ostypes.API('gdk_display_get_device_manager')(dispptr);
      pointer_device_ptr = ostypes.API('gdk_device_manager_get_client_pointer')(devmgrptr);
    } catch (ex) {
      // this is future proofing, right now firefox doesnt use GTK3.2
      // use GTK3.2
      var seatmgr = ostypes.API('gdk_display_get_default_seat')(dispptr);
      pointer_device_ptr = ostypes.API('gdk_seat_get_pointer')(seatmgr);


    }

    ostypes.API('gdk_device_get_position')(pointer_device_ptr, null, x.address(), y.address());

    if (aOptions.mods) ostypes.API('gdk_device_get_state')(pointer_device_ptr, ostypes.API('gdk_get_default_root_window')(), null, masks.address());
  }

  var rez = {
    x: parseInt(cutils.jscGetDeepest(x)),
    y: parseInt(cutils.jscGetDeepest(y)),
  };

  if (aOptions.mods) {
    masks = parseInt(cutils.jscGetDeepest(masks)); // im thinking the largest masks can be is less < 53bit, so i can safely parseInt it. if it is bigger then 53bit, then i should just jscGetDeepest and then use ctypes_math.UInt64.and below. so im assuming this is less then Number.MAX_SAFE_INTEGER
    for (var a_maskname of MASKNAME) {
      // if (ctypes_math.UInt64.and(masks, ostypes.CONST['GDK_' + a_maskname + '_MASK'])) {
      if (masks & ostypes.CONST['GDK_' + a_maskname + '_MASK']) {
        rez[a_maskname] = true;
      }
    }
  }
  return rez;
}

// Get native window coords on linux.
// copied from https://github.com/Noitidart/ostypes_playground/blob/6f0c6039/bootstrap.js
function getWindowCoords(aGdkWinPtr) {
  // gdk_window_get_root_origin: Object { x: 65, y: 486 }  bootstrap.js:150
  // gdk_window_get_geometry: Object { x: 0, y: 0 }  bootstrap.js:156
  // gdk_window_get_position: Object { x: 65, y: 514 }

  var x = ostypes.TYPE.gint();
  var y = ostypes.TYPE.gint();

  ostypes.API('gdk_window_get_root_origin')(aGdkWinPtr,  x.address(), y.address());
  ostypes.API('gdk_window_get_geometry')(aGdkWinPtr, x.address(), y.address(), null, null);
  ostypes.API('gdk_window_get_position')(aGdkWinPtr, x.address(), y.address());
  return {
    x: parseInt(cutils.jscGetDeepest(x)),
    y: parseInt(cutils.jscGetDeepest(y)),
  };
}

module.exports = {
  getNativeHandlePtrStr: getNativeHandlePtrStr,
  getWindowCoords: getWindowCoords,
  getMouseInfo: getMouseInfo
};
