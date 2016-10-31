const Request = require('sdk/request').Request;
const clientId = require('../package.json').config['SOUNDCLOUD_CLIENT_ID'];

module.exports = getSoundcloudUrl;

function getSoundcloudUrl(videoUrl, cb) {
  Request({
    url: `https://api.soundcloud.com/resolve.json?client_id=${clientId}&url=${videoUrl}`,
    onComplete: function (resp) {
      if (!resp.json) {
        cb('Could not connect to soundcloud.com');
        return;
      }

      if (resp.json.kind !== 'track' || !resp.json.streamable) {
        cb('not track or not streamable');
      } else {
        cb(null, resp.json.stream_url+'?client_id='+clientId);
      }
    }
  }).get();
}
