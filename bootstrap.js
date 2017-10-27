/* global config */
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
XPCOMUtils.defineLazyModuleGetter(this, 'Preferences',
                                  'resource://gre/modules/Preferences.jsm');

Cu.import('chrome://minvid-root/content/Config.jsm');
const { studyUtils } = Cu.import('chrome://minvid-lib/content/StudyUtils.jsm', {}); // eslint-disable-line mozilla/no-import-into-var-and-global
const studyConfig = config.study;

const EXPIRATION_DATE_STRING_PREF = 'extensions.minvidstudy.expirationDateString';
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

const REASONS = {
  APP_STARTUP:      1, // The application is starting up.
  APP_SHUTDOWN:     2, // The application is shutting down.
  ADDON_ENABLE:     3, // The add-on is being enabled.
  ADDON_DISABLE:    4, // The add-on is being disabled. (Also sent during uninstallation)
  ADDON_INSTALL:    5, // The add-on is being installed.
  ADDON_UNINSTALL:  6, // The add-on is being uninstalled.
  ADDON_UPGRADE:    7, // The add-on is being upgraded.
  ADDON_DOWNGRADE:  8  // The add-on is being downgraded.
};

async function startup(data, reason) { // eslint-disable-line no-unused-vars
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
      });
    });
  });

  // launch study setup
  studyUtils.setup(studyConfig);

  // Always set EXPIRATION_DATE_PREF if it not set, even if outside of install.
  // This is a failsafe if opt-out expiration doesn't work, so should be resilient.
  // Also helps for testing.
  if (!Preferences.has(EXPIRATION_DATE_STRING_PREF)) {
    const now = new Date(Date.now());
    const expirationDateString = new Date(now.setDate(now.getDate() + 14)).toISOString();
    Preferences.set(EXPIRATION_DATE_STRING_PREF, expirationDateString);
  }

  if (reason === REASONS.ADDON_INSTALL) {
    studyUtils.firstSeen(); // sends telemetry "enter"
    const eligible = await studyConfig.isEligible(); // addon-specific
    if (!eligible) {
      // uses config.endings.ineligible.url if any,
      // sends UT for "ineligible"
      // then uninstalls addon
      await studyUtils.endStudy({ reason: 'ineligible' });
      return;
    }
  }
  // sets experiment as active and sends installed telemetry upon
  // first install
  await studyUtils.startup({ reason });

  console.log(`info ${JSON.stringify(studyUtils.info())}`);

  const expirationDate = new Date(Preferences.get(EXPIRATION_DATE_STRING_PREF));
  if (Date.now() > expirationDate) {
    studyUtils.endStudy({ reason: 'expired' });
  }
}

function shutdown(data, reason) { // eslint-disable-line no-unused-vars
  closeWindow();

  // are we uninstalling?
  // if so, user or automatic?
  if (reason === REASONS.ADDON_UNINSTALL || reason === REASONS.ADDON_DISABLE) {
    if (!studyUtils._isEnding) {
      // we are the first requestors, must be user action.
      studyUtils.endStudy({ reason: 'user-disable' });
    }
  }

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
  const windowArgs = `left=${LOCATION.x},top=${LOCATION.y},chrome,dialog=no,width=${DIMENSIONS.width},height=${DIMENSIONS.height},titlebar=no`;

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
