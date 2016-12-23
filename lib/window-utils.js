const self = require('sdk/self');
const { Cu } = require('chrome');
Cu.import('resource://gre/modules/Console.jsm');
Cu.import('resource://gre/modules/Services.jsm');
const { getMostRecentBrowserWindow } = require('sdk/window/utils');
const { setTimeout, clearTimeout } = require('sdk/timers');
const saveLocation = require('./save-location');
const sendMetricsData = require('./send-metrics-data');
const topify = require('./topify');
const DraggableElement = require('./dragging-utils');
const tabs = require('sdk/tabs');

/* global Services */

const DEFAULT_DIMENSIONS = {
  height: 180,
  width: 320,
  minimizedHeight: 40
};

// TODO: if mvWindow changes, we need to destroy and create the player.
// This must be why we get those dead object errors. Note that mvWindow
// is passed into the DraggableElement constructor, could be a source of
// those errors. Maybe pass a getter instead of a window reference.
let mvWindow;

let commandPollTimer;

// waits till the window is ready, then calls callbacks.
function whenReady(cb) {
  // TODO: instead of setting timeout for each callback, just poll, then call all callbacks.
  if (mvWindow && mvWindow.gBrowserInit && mvWindow.gBrowserInit.delayedStartupFinished) return cb();
  /*
  if (mvWindow &&
      'AppData' in mvWindow.wrappedJSObject &&
      'YT' in mvWindow.wrappedJSObject &&
      'PlayerState' in mvWindow.wrappedJSObject.YT) return cb();
  */
  setTimeout(() => { whenReady(cb) }, 25);
}

// I can't get frame scripts working, so instead we just set global state directly in react. fml
function send(eventName, msg) {
  whenReady(() => {
    if (eventName === 'set-video') {
      // TBD: this is called twice for some reason

      // instead of making the window widget full-screen, just make the video
      // element cover the whole window when fullscreen is requested
      Services.prefs.setBoolPref("full-screen-api.ignore-widgets", true);

      // request fullscreen from the context of the page, but with chrome
      // privileges -- to avoid the restriction that fullscreen must be
      // requested directly in response to user action.
      var mm = mvWindow.gBrowser.selectedBrowser.messageManager;

      // don't show the 'is now full screen' message
      mvWindow.document.getElementById('fullscreen-warning').style.visibility = 'hidden';

      mm.loadFrameScript(`data:,
        dump("framescript5\\n");
        content.document.querySelector('video').requestFullscreen();
        addEventListener('fullscreenchange', function() {
          dump("on full screen change");
        });
      `, false); // <-- aAllowDelayedLoad
      //TBD unset the pref after successfully triggering fullscreen (or bail and close the window in case of something goes wrong)
      // Services.prefs.setBoolPref("full-screen-api.ignore-widgets", false);
    }
    /* TBD: this requires need new UI
    const newData = Object.assign(mvWindow.wrappedJSObject.AppData, msg);
    mvWindow.wrappedJSObject.AppData = newData;
    */
  });
}
dump("load");
function getWindow() {
  return mvWindow;
}

// Detecting when the window is closed is surprisingly difficult. If hotkeys
// close the window, no detectable event is fired. Instead, we have to listen
// for the nsIObserver event fired when _any_ XUL window is closed, then loop
// over all windows and look for the minvid window.
const onWindowClosed = (evt) => {
  // Note: we pass null here because minvid window is not of type 'navigator:browser'
  const enumerator = Services.wm.getEnumerator(null);
  let minvidExists = false;
  while (enumerator.hasMoreElements()) {
    const win = enumerator.getNext();
    if (win.name === 'minvid') {
      minvidExists = true;
      break;
    }
  }
  if (!minvidExists) closeWindow();
};
Services.obs.addObserver(onWindowClosed, 'xul-window-destroyed', false);

function closeWindow() {
  // If the window is gone, a 'dead object' error will be thrown; discard it.
  try {
    mvWindow && mvWindow.close();
  } catch (ex) {} // eslint-disable-line no-empty
  // stop communication
  clearTimeout(commandPollTimer);
  commandPollTimer = null;
  // clear the window pointer
  mvWindow = null;
  // TODO: do we need to manually tear down frame scripts?
}

function create() {
  if (mvWindow) return mvWindow;

  const window = getMostRecentBrowserWindow();

  // create a tab so that we have a tab left in the original window
  // (swapBrowsers won't leave the donor tabbrowser empty)
  // Perhaps this tab could allow the user to send the video back to the page?
  let mvBackupTab = window.gBrowser.addTab();
  const { x, y } = saveLocation.screenPosition;
  // TBD: this size is persisted for new browser windows
  const windowArgs = `left=${x},top=${y},width=320,height=180,titlebar=no`;
  // implicit assignment to mvWindow global
  mvWindow = window.openDialog("chrome://browser/content/", "_blank", "chrome,dialog=no,all" + windowArgs, window.gBrowser.mCurrentTab);
  //mvWindow = window.open(self.data.url('default.html'), 'minvid', windowArgs);
  // once the window's ready, make it always topmost
  whenReady(() => { topify(mvWindow); });
  initCommunication();
  whenReady(() => { makeDraggable(); });
  return mvWindow;
}

function initCommunication() {
  let errorCount = 0;
  // When the window's ready, start polling for pending commands
  function pollForCommands() {
    let cmd;
    try {
      cmd = mvWindow.wrappedJSObject.pendingCommands;
    } catch (ex) {
      console.error('something happened trying to get pendingCommands: ', ex); // eslint-disable-line no-console
      if (++errorCount > 10) {
        console.error('pendingCommands threw 10 times, giving up');            // eslint-disable-line no-console
        // NOTE: if we can't communicate with the window, we have to close it,
        // since the user cannot.
        closeWindow();
        return;
      }
    }
    commandPollTimer = setTimeout(pollForCommands, 25);
    if (!cmd || !cmd.length) return;
    // We found a command! Erase it, then act on it.
    mvWindow.wrappedJSObject.resetCommands();
    for (let i = 0; i < cmd.length; i++) {
      let parsed;
      try {
        parsed = JSON.parse(cmd[i]);
      } catch (ex) {
        console.error('malformed command sent to addon: ', cmd[i], ex); // eslint-disable-line no-console
        break;
      }
      handleMessage(parsed);
    }
  }
  whenReady(pollForCommands);
}

function makeDraggable() {
  // Based on WindowDraggingElement usage in popup.xml
  // https://dxr.mozilla.org/mozilla-central/source/toolkit/content/widgets/popup.xml#278-288
  const draghandle = new DraggableElement(mvWindow);
  draghandle.mouseDownCheck = () => { return true; };

  // Update the saved position each time the draggable window is dropped.
  // Listening for 'dragend' events doesn't work, so use 'mouseup' instead.
  mvWindow.document.addEventListener('mouseup', () => {
    saveLocation.screenPosition = {x: mvWindow.screenX, y: mvWindow.screenY};
  });
}

function destroy(isUnload) {
  closeWindow();
  if (isUnload) {
    Services.obs.removeObserver(onWindowClosed, 'xul-window-destroyed', false);
    saveLocation.destroy();
  }
}

function updateWindow() {
  return mvWindow || create();
}

function show() {
  if (!mvWindow) create();
}

function handleMessage(msg) {
  const title = msg.action;
  const opts = msg;
  if (title === 'send-to-tab') {
    const pageUrl = getPageUrl(opts.domain, opts.id, opts.time);
    if (pageUrl) tabs.open(pageUrl);
    else if (opts.url) tabs.open(opts.url);
    else {
      console.error('could not parse page url for ', opts); // eslint-disable-line no-console
      send('set-video', {error: 'Error loading video from ' + opts.domain});
    }
    send('set-video', {domain: '', src: ''});
    closeWindow();
  } else if (title === 'close') {
    send('set-video', {domain: '', src: ''});
    closeWindow();
  } else if (title === 'minimize') {
    mvWindow.resizeTo(DEFAULT_DIMENSIONS.width, DEFAULT_DIMENSIONS.minimizedHeight);
    mvWindow.moveBy(0, DEFAULT_DIMENSIONS.height - DEFAULT_DIMENSIONS.minimizedHeight);
    saveLocation.screenPosition = {x: mvWindow.screenX, y: mvWindow.screenY};
  } else if (title === 'maximize') {
    mvWindow.resizeTo(DEFAULT_DIMENSIONS.width, DEFAULT_DIMENSIONS.height);
    mvWindow.moveBy(0, DEFAULT_DIMENSIONS.minimizedHeight - DEFAULT_DIMENSIONS.height);
    saveLocation.screenPosition = {x: mvWindow.screenX, y: mvWindow.screenY};
  } else if (title === 'metrics-event') {
    // Note: sending in the window ref to avoid circular imports.
    sendMetricsData(opts.payload, mvWindow);
  }
}

function getPageUrl(domain, id, time) {
  let url;
  if (domain.indexOf('youtube') > -1) {
    url = `https://youtube.com/watch?v=${id}&t=${Math.floor(time)}`;
  } else if (domain.indexOf('vimeo') > -1) {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time - min * 60);
    url = `https://vimeo.com/${id}#t=${min}m${sec}s`;
  } else if (domain.indexOf('vine') > -1) {
    url = `https://vine.co/v/${id}`;
  }

  return url;
}

module.exports = {
  whenReady: whenReady,
  create: create,
  destroy: destroy,
  getWindow: getWindow,
  updateWindow: updateWindow,
  // replaces panel.port.emit
  send: send,
  // replaces panel.show
  show: show
};
