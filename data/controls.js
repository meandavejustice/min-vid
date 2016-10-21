/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

// Ping the addon when ready, and whenever the addon asks if we are ready.
self.port.emit('worker-ready');
self.port.on('worker-ready-check', () => {
  self.port.emit('worker-ready');
});

self.port.on('set-video', opts => {
  opts = Object.assign(opts, {
    loaded: false,
    progress: 0,
    playing: false
  });
  unsafeWindow.AppData = mergeDeep(unsafeWindow.AppData, opts);
});

// Bridge between app.js window messages to the
// addon. We pass true for the wantsUntrusted param
// in order to access the message events. #82
window.addEventListener('addon-message', function(ev) {
  self.port.emit('addon-message', ev.detail);
}, false, true);

/*
 * since this file is not bundled, we cannot use the deep-assign
 * package that we are using in the client code.
 */

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, source) {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
}
