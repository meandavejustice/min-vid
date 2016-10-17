/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

/* global Services */

const system = require('sdk/system');
const events = require('sdk/system/events');
const { getActiveView } = require('sdk/view/core');
const sendMetricsData = require('./send-metrics-data.js');
const makePanelDraggable = require('./make-panel-draggable.js');
const simpleStorage = require('sdk/simple-storage');
const { setTimeout } = require('sdk/timers');
const { Cu } = require('chrome');
Cu.import('resource://gre/modules/Services.jsm');

// panel utils:
// getPanel(): gets a panel reference. Pass the getter inside closures,
//             instead of the panel itself, so the panel can be freed when needed.
// create(): creates a panel. Note that code that needs the panel to be ready
//           should register a callback with whenPanelReady().
// destroy(): destroys a panel.
// whenPanelReady(): register a callback that will fire immediately, if the panel's
//                   ready; otherwise,, it'll fire when the panel is ready.
//                   Note that the list of callbacks is cleared when the panel is
//                   destroyed, so you need to create() first, then call this method.


// Note: keeping this whenPanelReady bit state sectioned off in case
// we replace it with a Task or Promise eventually.
const whenPanelReady = (function() {
  let isPanelReady = false;
  let panelReadyListeners = [];

  function _whenPanelReady(cb) {
    if (!isPanelReady) {
      panelReadyListeners.push(cb);
      return;
    }

    try {
      cb();
    } catch (ex) {
      console.error('Panel ready listener threw when invoked: ', ex); // eslint-disable-line no-console
    }
  }

  // When the panel is destroyed, call reset() to clear callbacks.
  _whenPanelReady.reset = function whenPanelReady__reset() {
    isPanelReady = false;
    panelReadyListeners = [];
  };

  // When the panel is ready, call ready() to fire callbacks.
  _whenPanelReady.ready = function whenPanelReady__ready() {
    isPanelReady = true;
    panelReadyListeners.forEach(cb => {
      try {
        cb();
      } catch (ex) {
        console.error('Panel ready listener threw when invoked: ', ex); // eslint-disable-line no-console
      }
    });
    panelReadyListeners = [];
  };

  return _whenPanelReady;
})();

const DEFAULT_SCREEN_COORDS = {
  x: 10,
  y: 10
};

const DEFAULT_DIMENSIONS = {
  height: 180,
  width: 320,
  minimizedHeight: 40
};
if (system.platform === 'linux') {
  DEFAULT_DIMENSIONS.minimizedHeight += 10;
}

const DEFAULT_PANEL_OPTIONS = {
  contentURL: './default.html?cachebust=' + Date.now(),
  contentScriptFile: './controls.js?cachebust=' + Date.now(),
  position: {
    top: 10,
    left: 10
  }
};

let sdkPanel;
let userDimensions;
let userPanelOptions;

// isUserPosition is true if the user has dragged the panel away from its
// default spot. Once true, we'll remember that position in the future.
let isUserPosition = !!simpleStorage.storage.isUserPosition;

// screenPosition holds the x,y screen coordinates where the user has dragged
// the panel. Persisted across sessions via SDK simple-storage.
// Because simple-storage is synchronous, use a cached value whenever possible,
// and update storage async (via setTimeout).
let screenPosition = simpleStorage.storage.screenPosition || DEFAULT_SCREEN_COORDS;

// TODO: Ensure we can abort at any point in this lengthy setup process.
function create(dimensions, panelOptions) {
  // Sequence of events:
  // 1. Destroy the panel, if it exists.
  if (sdkPanel) {
    console.error('panel.create called, but a panel already exists. Deleting old panel.'); // eslint-disable-line no-console
    destroy();
  }

  // 2. Register listeners to be attached after the panel is ready.
  whenPanelReady(() => {
    sdkPanel.port.on('addon-message', messageHandler);
  });

  // 3. Create the panel and set the userDimensions, userPanelOptions,
  //    userScreenCoords module globals.
  sdkPanel = _create(dimensions, panelOptions);

  // 4. Once the panel is in the XUL DOM (after _checkPanel calls the cb),
  //    modify the element's attributes and make it draggable (on Windows
  //    or Mac). Reseat in the XUL DOM to trigger the native Panel XBL code
  //    to run again. But note that we have to wait till DOMContentLoaded
  //    to do all this.
  _checkPanel(() => {
    const xulPanel = getActiveView(sdkPanel);
    events.on('DOMContentLoaded', onContentLoaded);
    function onContentLoaded(data) {
      if (data.subject !== xulPanel) return;
      events.off('DOMContentLoaded', onContentLoaded);
      xulPanel.setAttribute('noautohide', true);
      xulPanel.setAttribute('level', 'top');

      // Draggability seems to work for windows and mac, but not linux.
      if (system.platform === 'winnt' || system.platform === 'darwin') {
        makePanelDraggable(userDimensions, sdkPanel, onDragEnd);
      } else {
        // If we don't enable dragging, we still need to reseat the element
        // to get XBL to re-run with the other attribute changes.
        xulPanel.parentNode.replaceChild(xulPanel, xulPanel);
      }

      // Because we just modified the underlying XBL, we need to again wait for
      // the panel to be loaded and reinserted into the XUL DOM.
      _checkPanel(() => {
        // 5. Register panel load listener (panel.port.once('worker-ready', ... )).
        //    The content scripts are loaded after the panel and iframe are fully
        //    loaded, so when the content script sends a worker-ready ping, we know
        //    the panel is fully initialized.
        // TODO: if this ever throws, then we need to add a `panel.port` check to _checkPanel.
        sdkPanel.port.once('worker-ready', () => {
          // 6. After worker-ready, and after the draggable panel is found in the XUL
          //    DOM, correct the position via redraw(), call the whenPanelReady callbacks,
          //    and we're finally done.
          redraw();
          whenPanelReady.ready();
        });

        // Because we use a setTimeout loop to wait for the panel to appear in the
        // XUL DOM, we might miss the worker-ready signal. So, try to ask the
        // content script to send the worker-ready signal; if it throws, it's not
        // ready yet, so we are fine to wait. If it was fully initialized, it'll
        // resend the worker-ready signal, and initialization will continue.
        try {
          sdkPanel.port.emit('worker-ready-check');
        } catch (ex) {} // eslint-disable-line no-empty
      });
    }
  });
}

function _create(dimensions, panelOptions) {
  // create() may be called by code that doesn't pass in the right arguments.
  // To avoid causing problems, just store the config as userDimensions and userPanelOptions,
  // then reuse those if no new argument is passed in. :beers:
  userDimensions = dimensions || userDimensions || DEFAULT_DIMENSIONS;
  userPanelOptions = panelOptions || userPanelOptions || Object.assign(DEFAULT_PANEL_OPTIONS, userDimensions);

  // If we don't have a saved position from previous sessions, position relative
  // to the bottom left corner of the opening window.
  // Otherwise, the first time we create the panel, we need to offset the
  // screenPosition by the window position to get to the correct screen
  // location from the last session.
  if (!isUserPosition) {
    userPanelOptions.position = {bottom: 10, left: 10};
  } else {
    const currentWindow = Services.wm.getMostRecentWindow('navigator:browser');
    userPanelOptions.position = {
      top: screenPosition.y - currentWindow.mozInnerScreenY,
      left: screenPosition.x - currentWindow.mozInnerScreenX
    };
  }

  return require('./mysdk/panel').Panel(userPanelOptions);
}

function destroy() {
  if (sdkPanel) {
    sdkPanel.port.removeListener('addon-message', messageHandler);
    sdkPanel.dispose();
    sdkPanel = null;
  }
  whenPanelReady.reset();
}

function getPanel() {
  return sdkPanel;
}

// Polls until the panel is in the XUL DOM and registered as the SDK panel's
// view.
// The checkCount can be omitted; it's used to track the recursion count.
function _checkPanel(cb, checkCount) {
  if (typeof checkCount !== 'number') { return _checkPanel(cb, 1) }

  if (getActiveView(sdkPanel) && _getXulPanel()) return cb();

  // TODO: if the check fails, should we destroy and create again? or just give up?
  // TODO: is 10 seconds not long enough on ancient hardware?
  if (checkCount > 100) return console.error('unable to find panel after 10 seconds'); // eslint-disable-line no-console
  setTimeout(() => { _checkPanel(cb, ++checkCount); }, 100);
  return;
}

// Detects when the XUL panel is ready by:
// - looking for the panel in the XUL DOM
// - checking that one of the SDK panel's frames has its src set to the min-vid
//   page.
// Returns a boolean.
function _getXulPanel() {
  const currentWindow = Services.wm.getMostRecentWindow('navigator:browser');
  const popups = currentWindow.document.getElementById('mainPopupSet');
  const frame = popups.lastElementChild;

  const isSdkPopup = frame.hasAttribute('sdkscriptenabled');
  const minVidBackgroundFrame = frame.backgroundFrame &&
                                  frame.backgroundFrame.getAttribute &&
                                  frame.backgroundFrame.getAttribute('src').indexOf('min-vid') > -1;
  const minVidViewFrame = frame.viewFrame && frame.viewFrame.getAttribute &&
                            frame.viewFrame.getAttribute('src').indexOf('min-vid') > -1;

  // if it's an sdk popup, and one of the frames has a min-vid src, it's the one we want.
  return isSdkPopup && (minVidBackgroundFrame || minVidViewFrame);
}

// Updates the popup height when minimizing or un-minimizing.
function adjustHeight(newHeight) {
  // Resize the panel by changing the height of the panel, iframe, and stack
  // elements.
  // On linux, makePanelDraggable isn't invoked, so the stack doesn't exist.
  const xulPanel = getActiveView(sdkPanel);
  const stack = xulPanel.getElementsByTagName('stack') && xulPanel.getElementsByTagName('stack')[0];
  const frame = xulPanel.getElementsByTagName('iframe')[0];

  frame.setAttribute('height', newHeight);
  if (stack) stack.setAttribute('height', newHeight);
  xulPanel.sizeTo(userDimensions.width, newHeight);
}

// Moves the panel to a new location in the XUL DOM. This should force the
// panel to be redrawn.
// If `isSync` is truthy, redraw will be synchronous. Otherwise, will setTimeout(25).
function redraw(isSync) {
  function _redraw() {
    const xulPanel = getActiveView(sdkPanel);
    if (isUserPosition) {
      // If the user has dragged the panel somewhere, reopen the panel at that
      // screen position.
      xulPanel.moveTo(screenPosition.x, screenPosition.y);
    } else {
      // If the user hasn't dragged the panel before, just open the panel at
      // the bottom left corner of the currently active Firefox window.
      xulPanel.moveToAnchor(xulPanel.ownerDocument.documentElement, 'bottomleft bottomleft', 10, -10);
    }
  }
  isSync ? _redraw() : setTimeout(_redraw, 25);
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

function messageHandler(opts) {
  const title = opts.action;
  const panel = getPanel();

  if (title === 'send-to-tab') {
    const pageUrl = getPageUrl(opts.domain, opts.id, opts.time);
    if (pageUrl) require('sdk/tabs').open(pageUrl);
    else {
      console.error('could not parse page url for ', opts); // eslint-disable-line no-console
      panel.port.emit('set-video', {error: 'Error loading video from ' + opts.domain});
    }
    panel.port.emit('set-video', {domain: '', src: ''});
    panel.hide();
  } else if (title === 'close') {
    panel.port.emit('set-video', {domain: '', src: ''});
    panel.hide();
  } else if (title === 'minimize') {
    minimize();
  } else if (title === 'maximize') {
    maximize();
  } else if (title === 'metrics-event') {
    // Note: sending in the panel ref to try to avoid circular imports.
    sendMetricsData(opts.payload, sdkPanel);
  }
}

// Updates panel height to minimized height; updates coords (if panel has been
// dragged), then triggers a reflow (forcing XUL to re-layout the element).
function minimize() {
  adjustHeight(userDimensions.minimizedHeight);
  // If the user hasn't dragged the panel somewhere, just redraw it relative to
  // the parent window's bottom left corner. redraw() will check the height.
  if (!isUserPosition) return redraw();
  const newPosition = calculatePosition();
  // offset by (full height - minimized height) to adjust y coordinate
  newPosition.y += (userDimensions.height - userDimensions.minimizedHeight);
  setScreenPosition(newPosition);
  redraw(true);
}

// Updates panel height to full height; updates coords (if panel has been
// dragged), then triggers a reflow (forcing XUL to re-layout the element).
//
// Similar to minimize, except Firefox doesn't draw panels partly offscreen,
// so if we increase the height before updating the coordinates, the panel
// might appear to jump around a bit. For instance:
// - place minimized panel at bottom of screen
// - if panel height increases first, panel will be drawn below edge of screen
// - panel will then be shifted upwards until it's fully on screen
// - if position recalculation happens now, it's late, and will be incorrect
//
// To avoid this bug, we just have to recalculate position before adjusting
// the panel's height in the DOM.
function maximize() {
  if (!isUserPosition) {
    adjustHeight(userDimensions.height);
    redraw();
  } else {
    // Be sure not to adjustHeight until after the new position is calculated.
    let newY = screenPosition.y;
    const newPosition = calculatePosition();
    newY -= (userDimensions.height - userDimensions.minimizedHeight);
    setScreenPosition({x: newPosition.x, y: newY});
    redraw(true);
    adjustHeight(userDimensions.height);
  }
}

// Called by lib/launch-video to lazily create the panel:
// - if the panel doesn't exist, create it and return it;
// - if the panel does exist, but is attached to a different window, destroy it,
//   then create a new panel on the current window, and return it;
// - otherwise, the panel exists on the current window, so just return it.
// Returns a panel.
function updateWindow() {
  if (!sdkPanel) return create();
  const currentWindow = Services.wm.getMostRecentWindow('navigator:browser');
  const panelWindow = getActiveView(sdkPanel) && getActiveView(sdkPanel).ownerGlobal;

  if (currentWindow !== panelWindow) {
    destroy();
    const panel = create();
    whenPanelReady(redraw);
    return panel;
  }

  return sdkPanel;
}

// Recalculates the panel's screen position and returns {x, y} coords object
function calculatePosition() {
  const panel = getActiveView(sdkPanel);
  const window = panel.ownerGlobal;
  const clientRect = panel.getBoundingClientRect();
  const windowX = window.mozInnerScreenX;
  const windowY = window.mozInnerScreenY;
  const x = clientRect.left + windowX;
  const y = clientRect.top + windowY;
  return {x: x, y: y};
}

// Sets the panel's location after it's dragged and dropped.
function onDragEnd() {
  setScreenPosition(calculatePosition());
}

// Calculates and stores screen position after a panel is dragged, or after
// a previously dragged panel is minimized or maximized.
function setScreenPosition(pos) {
  screenPosition = pos;
  isUserPosition = true;
  // Write to simple storage later, because it's synchronous.
  setTimeout(() => {
    simpleStorage.storage.screenPosition = screenPosition;
    simpleStorage.storage.isUserPosition = true;
  });
}

module.exports = {
  whenPanelReady: whenPanelReady,
  create: create,
  destroy: destroy,
  getPanel: getPanel,
  redraw: redraw,
  updateWindow: updateWindow
};
