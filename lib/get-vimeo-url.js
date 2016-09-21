const Request = require('sdk/request').Request;

module.exports = getVimeoUrl;

function getVimeoUrl(videoId, cb) {
  Request({
    url: 'https://player.vimeo.com/video/' + videoId + '/config',
    onComplete: function (resp) {
      if (!resp.json) {
        cb('Could not connect to vimeo.com');
        return;
      }

      if (resp.json.request) {
        cb(null, resp.json.request.files.progressive[0].url);
      } else {
        cb(resp.json.message);
      }
    }
  }).get();
}
