const path = require('sdk/fs/path');
const isAudio = require('./is-audio');

module.exports = function(opts, cb) {
  const mediaType = isAudio(opts.url) ? 'audio' : 'video';
  cb({
    url: opts.url,
    preview: `../data/img/${mediaType}-thumbnail.svg`,
    title: decodeURIComponent(path.basename(opts.url))
  });
}
