const TestPilotGA = require('testpilot-ga');
import { sendShieldMetricPing } from './window-messages';
const isShieldStudy = (process.env.IS_SHIELD_STUDY === 'true');
let analytics;

if (!isShieldStudy) {
  analytics = new TestPilotGA({
    aid: browser.runtime.id,
    an: browser.runtime.getManifest().name,
    av: browser.runtime.getManifest().version,
    tid: browser.runtime.getManifest().config.GA_TRACKING_ID
  });
}

export default function sendMetricsData(o) {
  browser.storage.local.get().then(r => {
    if (isShieldStudy) {
      // send to telemetry method in bootstrap.js
      sendShieldMetricPing(o, r);
    } else {
      analytics.sendEvent(o.object, o.method, {
        cd2: r.left,
        cd3: r.top,
        cd4: r.width,
        cd5: r.height,
        cd6: o.domain,
        ds: 'webextension',
        ec: 'interactions'
      });
    }
  });
}
