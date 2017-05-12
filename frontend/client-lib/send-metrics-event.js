import sendToAddon from './send-to-addon';

export default function(object, method, domain) {
  sendToAddon({
    action: 'metrics-event',
    payload: {
      object,
      method,
      domain
    }
  });
}
