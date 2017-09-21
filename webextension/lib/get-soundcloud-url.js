const clientId = browser.runtime.getManifest().config.SOUNDCLOUD_CLIENT_ID;

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

export default function getSoundcloudUrl(opts, cb) {
  const url = `https://api.soundcloud.com/resolve.json?client_id=${clientId}&url=${opts.url}`;
  const item = {
    url: opts.url,
    title: '',
    preview: '',
    duration: 0,
    launchUrl: opts.url,
    domain: 'soundcloud.com',
    error: false
  };

  fetch(url, {
    method: 'GET',
    mode: 'cors',
    cache: 'default'
  }).then((res) => {
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
    if (res.status === 429) {
      item.error = 'errorScTrackLimit';
      cb(item);
    } else if (res.status === 403) {
      item.error = 'errorScRestricted';
      cb(item);
    } else {
      res.json().then(function(json) {
        if (!json) {
          item.error = 'errorScTrackConnection';
        } else if (!(json.kind === 'track' || json.kind === 'playlist')) {
          item.error = 'errorScTrack';
        } else if (!json.streamable) {
          item.error = 'errorScStreamable';
        } else if (json.kind === 'playlist' && json.tracks !== undefined) {
          item.addToQueue = json.tracks.map(t => {
            return {
              url: t.stream_url + '?client_id=' + clientId,
              title: t.title,
              preview: getSoundcloudArtworkUrl(t),
              duration: t.duration * .001, // convert to seconds
              launchUrl: t.permalink_url,
              domain: 'soundcloud.com',
              error: false
            };
          });
          item = Object.assign(item, item.addToQueue.shift());
        } else {
          item = Object.assign(item, {
            url: json.stream_url + '?client_id=' + clientId,
            title: json.title,
            preview: json.artwork_url,
            duration: json.duration * .001 // convert to seconds
          });
        }

        cb(item);
      });
    }
  }).catch((err) => {
    console.error(`Soundcloud request via fetch failed: ${err}`);  // eslint-disable-line no-console
    item.error = 'errorMsg';
    cb(item);
  });
}
