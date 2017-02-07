const Request = require('sdk/request').Request;
const clientId = require('../package.json').config['SOUNDCLOUD_CLIENT_ID'];

module.exports = getSoundcloudUrl;

function getSoundcloudUrl(videoUrl, cb) {
  Request({
    url: `https://api.soundcloud.com/resolve.json?client_id=${clientId}&url=${videoUrl}`,
    onComplete: function (resp) {
      if (resp.status === 429) {
        cb('errorScTrackLimit');
        return;
      } else if (resp.status === 403) {
        cb('errorScRestricted');
        return;
      } else if (!resp.json) {
        cb('errorScTrackConnection');
        return;
      } else if (resp.json.kind !== 'track') {
        cb('errorScTrack');
        return;
      } else if (!resp.json.streamable) {
        cb('errorScStreamable');
        return;
      } else {
        cb(null, resp.json.stream_url+'?client_id='+clientId);
      }
    }
  }).get();
}
