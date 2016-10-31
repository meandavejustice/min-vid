const debounce = require('lodash.debounce');
const emitter = require('./client-lib/emitter');

// initial render is triggered by appData being set in
// `data/controls`. Listener is setup in `client-lib/app-data.js`
require('./client-lib/app-data');

// global listeners
require('./client-lib/nsa');

window.onresize = debounce(() => {
  emitter.emit('resize', {
    width: document.body.clientWidth,
    height: document.body.clientHeight
  });
}, 200);

window.pendingCommands = [];

window.resetCommands = function() {
  // setting this from the addon seems to create an obj, not an array
  window.pendingCommands = [];
};
