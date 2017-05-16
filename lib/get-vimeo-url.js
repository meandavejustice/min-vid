const Request = require('sdk/request').Request;

module.exports = getVimeoUrl;

function getVimeoUrl(opts, cb) {
  Request({
    url: `https://player.vimeo.com/video/${opts.videoId}/config`,
    onComplete(resp) {
      if (!resp.json) {
        cb('errorVimeoConnection');
        return;
      }

      let item = {
        videoId: opts.videoId,
        domain: 'vimeo.com',
        error: false,
        title: '',
        preview: 'https://i.vimeocdn.com/video/error.jpg'
      };

      if (resp.json.request) {
        item = Object.assign(item, {
          url: resp.json.request.files.progressive[0].url,
          launchUrl: resp.json.request['share_url'],
          title: resp.json.video.title,
          preview: resp.json.video.thumbs['960'],
          duration: resp.json.video.duration
        });
      } else item.error = resp.json.message;

      cb(item);
    }
  }).get();
}
