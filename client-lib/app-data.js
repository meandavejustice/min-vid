const React = require('react');
const ReactDOM = require('react-dom');
const deepAssign = require('deep-assign');
const emitter = require('../client-lib/emitter');
const AppView = require('../components/app-view');

module.exports = window.AppData = new Proxy({
  id: '',
  src: '',
  url: '', // only used for <audio>, <video> tags, and soundcloud
  domain: '',
  minimized: false,
  loaded: false,
  error: false,
  muted: false,
  exited: false,
  time: '0:00 / 0:00',
  currentTime: 0,
  duration: 0,
  progress: 0.001, // force progress element to start out empty
  playing: false,
  volume: 0.5,
  strings: {},
  player: '',
  visual: 'time',
  set: (newValues) => {
    window.AppData = deepAssign(window.AppData, newValues);
  }
}, {
  set: function(obj, prop, value) {
    if (prop === 'strings') {
      try {
        obj[prop] = JSON.parse(value);
      } catch (ex) {
        window.console.error('Unable to parse l10n strings: ', ex);
      }
    } else obj[prop] = value;

    if (prop === 'src') {
      emitter.emit('reset');
    }
    renderApp();
    return true;
  }
});

function renderApp() {
  ReactDOM.render(React.createElement(AppView, window.AppData),
                  document.getElementById('container'));
}
