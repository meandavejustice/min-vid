const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
Cu.import('resource://gre/modules/XPCOMUtils.jsm');

const ADDON_ID = '@min-vid';
const WM = Cc['@mozilla.org/appshell/window-mediator;1'].
      getService(Ci.nsIWindowMediator);

XPCOMUtils.defineLazyModuleGetter(this, 'setTimeout',
                                  'resource://gre/modules/Timer.jsm');
XPCOMUtils.defineLazyModuleGetter(this, 'clearTimeout',
                                  'resource://gre/modules/Timer.jsm');

XPCOMUtils.defineLazyModuleGetter(this, 'topify',
                                  'chrome://minvid-lib/content/topify.js');
XPCOMUtils.defineLazyModuleGetter(this, 'DraggableElement',
                                  'chrome://minvid-lib/content/dragging-utils.js');

XPCOMUtils.defineLazyModuleGetter(this, 'LegacyExtensionsUtils',
                                  'resource://gre/modules/LegacyExtensionsUtils.jsm');

const LOCATION = { x: 0, y: 0 };
// TODO: consolidate with webextension/manifest.json
let DIMENSIONS = {
  height: 260,
  width: 400,
  minimizedHeight: 100
};

let commandPollTimer;

// TODO: if mvWindow changes, we need to destroy and create the player.
// This must be why we get those dead object errors. Note that mvWindow
// is passed into the DraggableElement constructor, could be a source of
// those errors. Maybe pass a getter instead of a window reference.
let mvWindow, webExtPort; // global port for communication with webextension

XPCOMUtils.defineLazyModuleGetter(this, 'AddonManager',
                                  'resource://gre/modules/AddonManager.jsm');
XPCOMUtils.defineLazyModuleGetter(this, 'Console',
                                  'resource://gre/modules/Console.jsm');
XPCOMUtils.defineLazyModuleGetter(this, 'Services',
                                  'resource://gre/modules/Services.jsm');
XPCOMUtils.defineLazyModuleGetter(this, 'LegacyExtensionsUtils',
                                  'resource://gre/modules/LegacyExtensionsUtils.jsm');

function startup(data, reason) { // eslint-disable-line no-unused-vars
  if (data.webExtension.started) return;
  data.webExtension.startup(reason).then(api => {
    api.browser.runtime.onConnect.addListener(port => {
      webExtPort = port;
      webExtPort.onMessage.addListener((msg) => {
        if (msg.content === 'window:send') send(msg.data);
        else if (msg.content === 'window:prepare') updateWindow();
        else if (msg.content === 'window:close') closeWindow();
        else if (msg.content === 'window:minimize') minimize();
        else if (msg.content === 'window:maximize') maximize();
        else if (msg.content === 'window:dimensions:update') setDimensions(msg.data);
        else if (msg.content === 'window:fullscreen:change') {
          if (mvWindow) topify(mvWindow);
        }
      });
    });
  });
}

function shutdown(data, reason) { // eslint-disable-line no-unused-vars
  closeWindow();
  LegacyExtensionsUtils.getEmbeddedExtensionFor({
    id: ADDON_ID,
    resourceURI: data.resourceURI
  }).shutdown(reason);
}

// These are mandatory in bootstrap.js, even if unused
function install(data, reason) {} // eslint-disable-line no-unused-vars
function uninstall(data, reason) {}// eslint-disable-line no-unused-vars

function updateWindow() {
  return mvWindow || create();
}

function setDimensions(dimensions) {
  DIMENSIONS = Object.assign(DIMENSIONS, dimensions);
}

/*
  WINDOW UTILS

  need to go back into own file
*/

// waits till the window is ready, then calls callbacks.
function whenReady(cb) {
  // TODO: instead of setting timeout for each callback, just poll,
  // then call all callbacks.
  if (mvWindow && 'AppData' in mvWindow.wrappedJSObject) return cb();
  setTimeout(() => { whenReady(cb); }, 25);
}

// I can't get frame scripts working, so instead we just set global state directly in react. fml
function send(msg) {
  whenReady(() => {
    const newData = Object.assign(mvWindow.wrappedJSObject.AppData, msg);
    if (newData.confirm) maximize();
    mvWindow.wrappedJSObject.AppData = newData;
  });
}

// Detecting when the window is closed is surprisingly difficult. If hotkeys
// close the window, no detectable event is fired. Instead, we have to listen
// for the nsIObserver event fired when _any_ XUL window is closed, then loop
// over all windows and look for the minvid window.
const onWindowClosed = () => {
  // Note: we pass null here because minvid window is not of type 'navigator:browser'
  const enumerator = Services.wm.getEnumerator(null);

  let minvidExists = false;
  while (enumerator.hasMoreElements()) {
    const win = enumerator.getNext();
    if (win.name === 'min-vid') {
      minvidExists = true;
      break;
    }
  }
  if (!minvidExists) closeWindow();
};
Services.obs.addObserver(onWindowClosed, 'xul-window-destroyed', false); // eslint-disable-line mozilla/no-useless-parameters

// This handles the case where the min vid window is kept open
// after closing the last firefox window.
function closeRequested() {
  destroy(true);
}
Services.obs.addObserver(closeRequested, 'browser-lastwindow-close-requested', false); // eslint-disable-line mozilla/no-useless-parameters

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

  const window = WM.getMostRecentWindow('navigator:browser');
  // TODO: pass correct dimensions and location
  const windowArgs = `left=${LOCATION.x},top=${LOCATION.y},chrome,dialog=no,width=${DIMENSIONS.width},height=${DIMENSIONS.height},titlebar=no`;

  // const windowArgs = `left=${x},top=${y},chrome,dialog=no,width=${prefs.width},height=${prefs.height},titlebar=no`;
  // implicit assignment to mvWindow global
  mvWindow = window.open('resource://minvid-data/default.html', 'min-vid', windowArgs);

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
        webExtPort.postMessage({
          content: 'msg-from-frontend',
          data: parsed
        });
      } catch (ex) {
        console.error('malformed command sent to addon: ', cmd[i], ex); // eslint-disable-line no-console
        break;
      }
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
  mvWindow.document.addEventListener('mouseup', sendLocation);
}

function destroy(isUnload) {
  closeWindow();
  if (isUnload) {
    Services.obs.removeObserver(onWindowClosed, 'xul-window-destroyed');
    Services.obs.removeObserver(closeRequested, 'browser-lastwindow-close-requested');
  }
}

function minimize() {
  mvWindow.resizeTo(DIMENSIONS.width, DIMENSIONS.minimizedHeight);
  mvWindow.moveBy(0, DIMENSIONS.height - DIMENSIONS.minimizedHeight);
  sendLocation();
}

function maximize() {
  mvWindow.resizeTo(DIMENSIONS.width, DIMENSIONS.height);
  mvWindow.moveBy(0, DIMENSIONS.minimizedHeight - DIMENSIONS.height);
  sendLocation();
}

function sendLocation() {
  webExtPort.postMessage({
    content: 'position-changed',
    data: {left: LOCATION.x = mvWindow.screenX, top: LOCATION.y = mvWindow.screenY}
  });
}
