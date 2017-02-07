const self = require('sdk/self');
const { Cu } = require('chrome');
Cu.import('resource://gre/modules/Console.jsm');
Cu.import('resource://gre/modules/Services.jsm');
const prefs = require('sdk/simple-prefs').prefs;
const store = require('sdk/simple-storage').storage;
const { getMostRecentBrowserWindow } = require('sdk/window/utils');
const { setTimeout, clearTimeout } = require('sdk/timers');
const saveLocation = require('./save-location');
const sendMetricsData = require('./send-metrics-data');
const topify = require('./topify');
const DraggableElement = require('./dragging-utils');
const tabs = require('sdk/tabs');
const youtubeHelpers = require('./youtube-helpers');

/* global Services */

const DEFAULT_DIMENSIONS = {
  height: prefs.height,
  width: prefs.width,
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
  if (mvWindow &&
      'AppData' in mvWindow.wrappedJSObject &&
      'YT' in mvWindow.wrappedJSObject &&
      'PlayerState' in mvWindow.wrappedJSObject.YT) return cb();
  setTimeout(() => { whenReady(cb) }, 25);
}

// I can't get frame scripts working, so instead we just set global state directly in react. fml
function send(eventName, msg) {
  whenReady(() => {
    const newData = Object.assign(mvWindow.wrappedJSObject.AppData, msg);
    mvWindow.wrappedJSObject.AppData = newData;
  });
}

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

// This handles the case where the min vid window is kept open
// after closing the last firefox window.
function closeRequested() {
  destroy(true);
}
Services.obs.addObserver(closeRequested, 'browser-lastwindow-close-requested', false);

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
  const { x, y } = saveLocation.screenPosition;
  const windowArgs = `left=${x},top=${y},chrome,dialog=no,width=${prefs.width},height=${prefs.height},titlebar=no`;
  // implicit assignment to mvWindow global
  mvWindow = window.open(self.data.url('default.html'), 'minvid', windowArgs);
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
    Services.obs.removeObserver(closeRequested, 'browser-lastwindow-close-requested', false);
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
    const pageUrl = opts.launchUrl ? opts.launchUrl : getPageUrl(opts.domain, opts.id, opts.time);
    if (pageUrl) tabs.open(pageUrl);
    else {
      console.error('could not parse page url for ', opts); // eslint-disable-line no-console
      send('set-video', {error: 'Error loading video from ' + opts.domain});
    }
    send('set-video', {domain: '', src: ''});
    closeWindow();
  } else if (title === 'close') {
    store.history.unshift(store.queue.shift());
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
  } else if (title === 'track-ended') {
    store.history.unshift(store.queue.shift());
    send('set-video', {
      playing: true,
      queue: JSON.stringify(store.queue),
      history: JSON.stringify(store.history)
    });
  } else if (title === 'track-removed') {
    if (opts.isHistory) store.history.splice(opts.index, 1);
    else store.queue.splice(opts.index, 1);

    if (store.queue.length) {
      send('set-video', {
        queue: JSON.stringify(store.queue),
        history: JSON.stringify(store.history)
      });
    } else {
      send('set-video', {domain: '', src: ''});
      closeWindow();
    }
  } else if (title === 'track-added-from-history') {
    // In this case we should duplicate the item from the history
    // array.
    store.queue.push(store.history[opts.index]);
    sendMetricsData({
      object: 'queue',
      method: 'track-added-from-history',
      domain: store.queue[0].domain
    }, mvWindow);
    send('set-video', {queue: JSON.stringify(store.queue)});
  } else if (title === 'track-expedited') {
    /*
     * the goal here is to get the track index, move it to the top
     * of the queue, and play it.
     * We also need to handle the currently playing track correctly.

     * If track 0 in the queue is not playing, and hasn't been
     * played at all(currentTime == 0), we should move the newTrack
     * to the top of the queue and play it.

     * If track 0 in the queue is playing or has been played
     * (currentTime > 0), we should move track 0 into the history
     * array, and then move newTrack to the top of the queue
     */
    if (opts.moveIndexZero) {
      store.history.unshift(store.queue.shift());
      if (opts.isHistory) opts.index++;
      else opts.index--;
    }

    if (opts.isHistory) {
      store.queue.unshift(store.history[opts.index])
    } else store.queue.unshift(store.queue.splice(opts.index, 1)[0])

    sendMetricsData({
      object: 'queue',
      method: 'track-expedited',
      domain: store.queue[0].domain
    }, mvWindow);

    send('set-video', {
      playing: true,
      queue: JSON.stringify(store.queue),
      history: JSON.stringify(store.history)
    });
  } else if (title === 'track-reordered') {
    const newQueue = store.queue.slice();
    newQueue.splice(opts.newIndex, 0, newQueue.splice(opts.oldIndex, 1)[0]);
    store.queue = newQueue;
    sendMetricsData({
      object: 'queue',
      method: 'track-reordered',
      domain: store.queue[0].domain
    }, mvWindow);
    send('set-video', {queue: JSON.stringify(store.queue)});
  } else if (title === 'play-from-history') {
    store.queue.splice(0);
    store.queue = store.history.slice(0, 10);
    send('set-video', {
      playing: true,
      exited: false,
      queue: JSON.stringify(store.queue),
      history: JSON.stringify(store.history)
    });
  } else if (title === 'clear') {
    sendMetricsData({
      object: 'queue',
      method: `clear:${opts.choice}`,
      domain: ''
    }, mvWindow);
    if (opts.choice === 'history') {
      store.history = [];
      send('set-video', {history: JSON.stringify(store.history)});
    } else {
      store.queue = [];
      send('set-video', {domain: '', src: '', queue: JSON.stringify(store.queue)});
      closeWindow();
    }
  } else if (title === 'confirm') {
    if (opts.choice === 'playlist') {
      youtubeHelpers.getPlaylist(opts, playlist => {

        // if the playlist was launched on with a certain video
        // we need to grab the playlist at that playlist
        if (opts.index) playlist = playlist.splice(opts.index - 1);

        if (opts.playerMethod === 'play') {
          // if the 'play-now' option was selected, and min vid has a
          // track playing we need to move that item to history before
          // front loading the playlist results into the queue.
          if (opts.moveIndexZero) store.history.unshift(store.queue.shift());
          store.queue = playlist.concat(store.queue);
        } else store.queue = store.queue.concat(playlist);

        const response = {
          trackAdded: (opts.playerMethod === 'add-to-queue') && (store.queue.length > 1),
          error: false,
          queue: JSON.stringify(store.queue),
          history: JSON.stringify(store.history),
          confirm: false,
          confirmContent: '{}'
        };

        if (opts.playerMethod === 'play') response.playing = true;
        send('set-video', response);
      });
    } else if (opts.choice === 'cancel') {
      if (!store.queue.length) {
        send('set-video', {
          domain: '',
          src: '',
          confirm: false,
          confirmContent: '{}'
        });
        closeWindow();
      } else {
        send('set-video', {
          confirm: false,
          confirmContent: '{}',
          queue: JSON.stringify(store.queue),
          history: JSON.stringify(store.history)
        });
      }
    } else {
      youtubeHelpers.getVideo(opts, video => {
        if (opts.playerMethod === 'play') {
          // if the 'play-now' option was selected, and min vid has a
          // track playing we need to move that item to history before
          // front loading the video into the queue.
          if (opts.moveIndexZero) store.history.unshift(store.queue.shift());
          store.queue.unshift(video);
        } else store.queue = store.queue.push(video);
        const response = {
          trackAdded: (opts.playerMethod === 'add-to-queue') && (store.queue.length > 1),
          error: false,
          queue: JSON.stringify(store.queue),
          history: JSON.stringify(store.history),
          confirm: false,
          confirmContent: '{}'
        };

        if (opts.playerMethod === 'play') response.playing = true;

        send('set-video', response);
      });
    }
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
