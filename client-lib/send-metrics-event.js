const sendToAddon = require('./send-to-addon');

module.exports = sendMetricsEvent;

function sendMetricsEvent(object, method) {
  sendToAddon({
    action: 'metrics-event',
    payload: {
      object: object,
      method: method,
      domain: window.AppData.domain
    }
  });
}
