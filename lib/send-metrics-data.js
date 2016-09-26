/* global Services */

const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm');

const { getActiveView } = require('sdk/view/core');

module.exports = sendMetricsData;

function sendMetricsData(o, panel) {
  const coords = getActiveView(panel).getBoundingClientRect();
  // NOTE: this packet follows a predefined data format and cannot be changed
  //       without notifying the data team. See docs/metrics.md for more.
  const data = {
    object: o.object,
    method: o.method,
    domain: o.domain,
    'played_count': o.playedCount,
    video_x: coords.top,
    video_y: coords.left,
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
