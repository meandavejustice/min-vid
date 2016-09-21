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
  playedCount: 0,
  volume: '0.5'
};

window.AppData = new Proxy(defaultData, {
  set: function(obj, prop, value) {
    obj[prop] = value;
    renderApp();
    return true;
  }
});

function renderApp() {
  ReactDOM.render(React.createElement(AppView, window.AppData),
                  document.getElementById('container'));
}
