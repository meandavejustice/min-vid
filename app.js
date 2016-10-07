const React = require('react');
const ReactDOM = require('react-dom');
const AppView = require('./components/app-view');

const defaultData = {
  id: '',
  src: '',
  domain: '',
  minimized: false,
  loaded: false,
  error: false,
  muted: false,
  currentTime: '0:00 / 0:00',
  duration: 0,
  progress: 0.001, // force progress element to start out empty
  playing: false,
  volume: '0.5',
  strings: {}
};

window.AppData = new Proxy(defaultData, {
  set: function(obj, prop, value) {
    if (prop === 'strings') {
      try {
        obj[prop] = JSON.parse(value);
      } catch (ex) {
        window.console.error('Unable to parse l10n strings: ', ex);
      }
    } else obj[prop] = value;
    renderApp();
    return true;
  }
});

window.pendingCommands = [];

window.resetCommands = function() {
  // setting this from the addon seems to create an obj, not an array
  window.pendingCommands = [];
};

function renderApp() {
  ReactDOM.render(React.createElement(AppView, window.AppData),
                  document.getElementById('container'));
}
