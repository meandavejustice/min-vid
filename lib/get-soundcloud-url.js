const Request = require('sdk/request').Request;
const clientId = require('../package.json').config['SOUNDCLOUD_CLIENT_ID'];

module.exports = getSoundcloudUrl;

function getSoundcloudArtworkUrl(json) {
  // track artwork
  if (json.artwork_url) {
    return json.artwork_url;
  }
  // user avatar
  if (json.user.avatar_url) {
    return json.user.avatar_url;
  }
  // default image
  return null;
}

function getSoundcloudUrl(opts, cb) {
  Request({
    url: `https://api.soundcloud.com/resolve.json?client_id=${clientId}&url=${opts.url}`,
    onComplete(resp) {
      let item = {
        url: opts.url,
        title: '',
        preview: '',
        duration: 0,
        launchUrl: opts.url,
        domain: 'soundcloud.com',
        error: false,
        addToQueue: undefined
      };

      if (resp.status === 429) {
        item.error = 'errorScTrackLimit';
      } else if (resp.status === 403) {
        item.error = 'errorScRestricted';
      } else if (!resp.json) {
        item.error = 'errorScTrackConnection';
      } else if (!(resp.json.kind === 'track' || resp.json.kind === 'playlist')) {
        item.error = 'errorScTrack';
      } else if (!resp.json.streamable) {
        item.error = 'errorScStreamable';
      } else if (resp.json.kind === 'playlist' && resp.json.tracks !== undefined) {
        item.addToQueue = resp.json.tracks.map(t => {
          return {
            url: t.stream_url + '?client_id=' + clientId,
            title: t.title,
            preview: getSoundcloudArtworkUrl(t),
            duration: t.duration * .001, // convert to seconds
            launchUrl: t.permalink_url,
            domain: 'soundcloud.com',
            error: false
          }
        });
        item = Object.assign(item, item.addToQueue.shift());
      } else {
        item = Object.assign(item, {
          url: resp.json.stream_url + '?client_id=' + clientId,
          title: resp.json.title,
          preview: getSoundcloudArtworkUrl(resp.json),
          duration: resp.json.duration * .001 // convert to seconds
        });
      }

      cb(item);
    }
  }).get();
}
