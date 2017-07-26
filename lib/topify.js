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
const {utils: Cu } = Components;
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/ctypes.jsm');
Cu.import('resource://gre/modules/Console.jsm');
Cu.import('chrome://minvid-ostypes/content/cutils.jsm');

Cu.import('chrome://minvid-lib/content/native-window-utils.js');
const { getNativeHandlePtrStr } = nativeWindowUtils; // eslint-disable-line no-undef
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
function topify(domWindow) {  // eslint-disable-line no-unused-vars
  if (unsupportedPlatform) return console.error(`Unable to topify minvid window on unsupported window toolkit ${platform}.`); // eslint-disable-line no-console

  let winPtrStr = getNativeHandlePtrStr(domWindow);
  if (!winPtrStr) return console.error('Unable to get native pointer for window.'); // eslint-disable-line no-console

  // test code - to test issue #619
  if (platform === 'cocoa') {
    // watch for X seconds to see if if winPtrStr changes. it only changes once, from what i see (sometimes), so after first change stop checking
    const CHECK_INTERVAL = 1000; // check every this ms
    const MIN_TO_CHECK = 1; // minutes
    const MAX_CHECK_DATE = Date.now() + (MIN_TO_CHECK * 60 * 1000);
    (function checkWinPtrStr() {
      setTimeout(function() {
        const nowWinPtrStr = getNativeHandlePtrStr(domWindow);
        if (nowWinPtrStr !== winPtrStr) {
          console.error('win pointer changed!!!!!, must re-topify');
          winPtrStr = nowWinPtrStr;
          _macTopify(winPtrStr);
        } else {
          console.log('win pointer is same');
          if (Date.now() < MAX_CHECK_DATE) checkWinPtrStr();
          else console.log('win pointer nerver changed');
        }
      }, CHECK_INTERVAL);
    })();
  }
  
  if (platform === 'windows') return _winntTopify(winPtrStr);
  else if (platform === 'cocoa') return _macTopify(winPtrStr);
  else if (platform === 'gtk') return _nixTopify(winPtrStr);
 
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

const EXPORTED_SYMBOLS = ['topify']; // eslint-disable-line no-unused-vars
