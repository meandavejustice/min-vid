const Metrics = require('testpilot-metrics');
const store = require('sdk/simple-storage').storage;
const manifest = require('../package.json');
const isPrivate = require('sdk/private-browsing').isPrivate;

const { sendEvent } = new Metrics({
  id: require('sdk/self').id,
  type: 'sdk',
  version: manifest.version,
  uid: store.clientUUID,
  tid: manifest.config['GA_TRACKING_ID']
});

module.exports = sendMetricsData;

function sendMetricsData(o, win) {
  // Note: window ref is optional, used to avoid circular refs with window-utils.js.
  win = win || require('./window-utils.js').getWindow();

  if (!win || isPrivate(win)) return;

  const coords = win.document.documentElement.getBoundingClientRect();

  // NOTE: this packet follows a predefined data format and cannot be changed
  //       without notifying the data team. See docs/metrics.md for more.
  sendEvent({
    object: o.object,
    method: o.method,
    domain: o.domain,
    video_x: coords.left,
    video_y: coords.top,
    video_width: coords.width,
    video_height: coords.height
  }, function transform(input, output) {
    output.cd2 = input['video_x'];
    output.cd3 = input['video_y'];
    output.cd4 = input['video_width'];
    output.cd5 = input['video_height'];
    output.cd6 = input.domain;
    return output;
  });
}
