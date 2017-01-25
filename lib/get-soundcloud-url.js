const Request = require('sdk/request').Request;
const clientId = require('../package.json').config['SOUNDCLOUD_CLIENT_ID'];

module.exports = getSoundcloudUrl;

function getSoundcloudUrl(videoUrl, cb) {
  Request({
    url: `https://api.soundcloud.com/resolve.json?client_id=${clientId}&url=${videoUrl}`,
    onComplete: function (resp) {
      if (resp.status === 429) {
        cb('ttScTrackLimit');
        return;
      } else if (resp.status === 403) {
        cb('ttScRestricted');
        return;
      } else if (!resp.json) {
        cb('ttScTrackConnection');
        return;
      } else if (resp.json.kind !== 'track') {
        cb('ttScTrack');
        return;
      } else if (!resp.json.streamable) {
        cb('ttScStreamable');
        return;
      } else {
        cb(null, resp.json.stream_url+'?client_id='+clientId);
      }
    }
  }).get();
}
