/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

self.port.on('set-video', opts => {
  opts = Object.assign(opts, {
    loaded: false,
    error: false,
    progress: 0,
    playing: false
  });
  unsafeWindow.AppData = Object.assign(unsafeWindow.AppData, opts);
});

// Bridge between app.js window messages to the
// addon. We pass true for the wantsUntrusted param
// in order to access the message events. #82
window.addEventListener('addon-message', function(ev) {
  self.port.emit('addon-message', ev.detail);
}, false, true);
