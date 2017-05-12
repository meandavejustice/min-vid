import debounce from 'lodash.debounce';

// initial render is triggered by appData being set in
// `data/controls`. Listener is setup in `client-lib/app-data.js`
import { init } from './client-lib/app-data';

init();

window.pendingCommands = [];

window.resetCommands = function() {
  // setting this from the addon seems to create an obj, not an
  // array
  window.pendingCommands = [];
};

window.onresize = debounce(() => {
  window.AppData.set({
    width: document.body.clientWidth,
    height: document.body.clientHeight
  });
}, 200);
