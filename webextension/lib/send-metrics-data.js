const TestPilotGA = require('testpilot-ga');
const store = browser.storage.local;

const analytics = new TestPilotGA({
  aid: browser.runtime.id,
  an: browser.runtime.getManifest().name,
  av: browser.runtime.getManifest().version,
  tid: browser.runtime.getManifest().config['GA_TRACKING_ID']
});

export default function sendMetricsData(o) {
  store.get().then(r => {
    analytics
      .sendEvent(o.object, o.method, {
        // cd1: "variant value",
        cd2: r.left,
        cd3: r.top,
        cd4: r.width,
        cd5: r.height,
        cd6: o.domain,
        el: o,
        ds: 'webextension'
      });
  });
}
