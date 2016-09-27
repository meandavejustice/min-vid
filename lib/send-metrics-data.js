/* global Services */

const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm');

const { getActiveView } = require('sdk/view/core');
const { setTimeout } = require('sdk/timers');

module.exports = sendMetricsData;

function sendMetricsData(o, panel) {
  // Note: panel is optional, used to avoid circular refs with panel-utils.js.
  panel = panel || require('./panel-utils.js').getPanel();

  // If the panel's missing, try again a few seconds later.
  if (!panel) {
    return setTimeout(() => { sendMetricsData(o) }, 10 * 1000);
  }

  const coords = getActiveView(panel).getBoundingClientRect();
  // NOTE: this packet follows a predefined data format and cannot be changed
  //       without notifying the data team. See docs/metrics.md for more.
  const data = {
    object: o.object,
    method: o.method,
    domain: o.domain,
    'played_count': o.playedCount,
    video_x: coords.left,
    video_y: coords.top,
    video_width: coords.width,
    video_height: coords.height
  };

  const subject = {
    wrappedJSObject: {
      observersModuleSubjectWrapper: true,
      object: '@min-vid'
    }
  };
  Services.obs.notifyObservers(subject, 'testpilot::send-metric', JSON.stringify(data));
}
