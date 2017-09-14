const TestPilotGA = require('testpilot-ga');

const analytics = new TestPilotGA({
  aid: browser.runtime.id,
  an: browser.runtime.getManifest().name,
  av: browser.runtime.getManifest().version,
  tid: browser.runtime.getManifest().config['GA_TRACKING_ID']
});

export default function sendMetricsData(o) {
  browser.storage.local.get().then(r => {
    analytics.sendEvent(o.object, o.method, {
      // cd1: "variant value",
      cd2: r.left,
      cd3: r.top,
      cd4: r.width,
      cd5: r.height,
      cd6: o.domain,
      ds: 'webextension',
      ec: 'interactions'
    });
  });
}
