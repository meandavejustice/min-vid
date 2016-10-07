/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

// This library uses js-ctypes to force the minvid window to be topmost
// on windows, mac, and linux/BSD systems.
//
// This library is partially derived from MPL 2.0-licensed code available at
// https://github.com/Noitidart/Topick.

/* global Services, ctypes, ostypes */
const { Cu } = require('chrome');
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/ctypes.jsm');
Cu.import('resource://gre/modules/Console.jsm');

Cu.import('chrome://minvid-ostypes/content/cutils.jsm');
const { getNativeHandlePtrStr } = require('./native-window-utils.js');

let platform;
let unsupportedPlatform;

function _initPlatformCode() {
  // Platforms we support. gtk includes linux/BSD systems.
  const platforms = {
    windows:  'chrome://minvid-ostypes/content/ostypes_win.jsm',
    gtk:    'chrome://minvid-ostypes/content/ostypes_x11.jsm',
    cocoa: 'chrome://minvid-ostypes/content/ostypes_mac.jsm'
  };

  const wm = Services.appinfo.widgetToolkit.toLowerCase();
  // No need to distinguish between gtk2 and gtk3.
  platform = wm.startsWith('gtk') ? 'gtk' : wm;

  if (platform in platforms) Cu.import(platforms[platform]);
  else unsupportedPlatform = true;
}
_initPlatformCode();

// topify tries to make the provided domWindow topmost, using platform-specific code.
// Returns true if successful.
function topify(domWindow) {
  if (unsupportedPlatform) return console.error(`Unable to topify minvid window on unsupported window toolkit ${platform}.`); // eslint-disable-line no-console

  const winPtrStr = getNativeHandlePtrStr(domWindow);
  if (!winPtrStr) return console.error('Unable to get native pointer for window.'); // eslint-disable-line no-console

  if (platform === 'windows')    return _winntTopify(winPtrStr);
  else if (platform === 'cocoa') return _macTopify(winPtrStr);
  else if (platform === 'gtk')   return _nixTopify(winPtrStr);
}

function _winntTopify(winPtrStr) {
  const winPtr = ctypes.voidptr_t(ctypes.UInt64(winPtrStr));
  const didTopify = ostypes.API('SetWindowPos')(winPtr, ostypes.CONST.HWND_TOPMOST, 0, 0, 0, 0, ostypes.CONST.SWP_NOSIZE | ostypes.CONST.SWP_NOMOVE);
  return didTopify ? true : console.error(`Unable to topify minvid window: ${ctypes.winLastError}`); // eslint-disable-line no-console
}

function _macTopify(winPtrStr) {
  const floatingWindowLevel = ostypes.API('CGWindowLevelForKey')(ostypes.CONST.kCGFloatingWindowLevelKey);
  const winPtr = ostypes.TYPE.NSWindow(ctypes.UInt64(winPtrStr));
  const didTopify = ostypes.API('objc_msgSend')(winPtr, ostypes.HELPER.sel('setLevel:'), ostypes.TYPE.NSInteger(floatingWindowLevel));
  return didTopify ? true : console.error(`Unable to topify minvid window: ${ctypes.winLastError}`); // eslint-disable-line no-console
}

function _nixTopify(winPtrStr) {
  const gdkWin = ostypes.TYPE.GdkWindow.ptr(ctypes.UInt64(winPtrStr));
  const gtkWin = ostypes.HELPER.gdkWinPtrToGtkWinPtr(gdkWin);
  ostypes.API('gtk_window_set_keep_above')(gtkWin, 1);
  // TODO: figure out how to detect and log errors.
  return true;
}

module.exports = topify;
