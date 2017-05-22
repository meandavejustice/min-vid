const sendToAddon = require('./send-to-addon');

module.exports = sendMetricsEvent;

function sendMetricsEvent(object, method, domain) {
  sendToAddon({
    action: 'metrics-event',
    payload: {
      object,
      method,
      domain
    }
  });
}
