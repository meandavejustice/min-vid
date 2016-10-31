const getVideoId = require('get-video-id');
const getPlayer = require('./get-player');
const getLocaleStrings = require('./get-locale-strings');
const windowUtils = require('./window-utils');

module.exports = launchVideo;

// Pass in a video URL as opts.src or pass in a video URL lookup function as opts.getUrlFn
function launchVideo(opts) {
  // UpdateWindow might create a new panel, so do the remaining launch work
  // asynchronously.
  windowUtils.updateWindow();
  windowUtils.whenReady(() => {
    // opts {url: url,
    //       getUrlFn: getYouTubeUrl,
    //       domain: 'youtube.com',
    //       time: 16 // integer seconds OPTIONAL
    //       src: streamURL or ''}
    const id = getVideoId(opts.url);
    const player = getPlayer(opts);
    const isAudio = player === 'audio';

    // direct <audio> tags do not have a getUrlFn
    // so we set a mock one here
    if (!opts.getUrlFn) {
      opts.getUrlFn = (id, cb) => {
        if (!opts.src) cb('No src for direct <audio> and <video> tags');
        cb(null, opts.src);
      }
    }

    windowUtils.show();
    // send some initial data to open the loading view
    // before we fetch the media source
    windowUtils.send('set-video', {
      domain: opts.domain,
      id: id || '',
      volume: opts.volume || 0.5,
      muted: opts.muted || false,
      strings: getLocaleStrings(opts.domain, isAudio),
      tabId: require('sdk/tabs').activeTab.id,
      url: id ? '' : opts.url, // only send url down if not vimeo or YouTube
      player: player
    });

    // fetch the media source and set it
    opts.getUrlFn(id ? id : opts.url, function(err, streamUrl) {
      if (err) console.error('LaunchVideo failed to get the streamUrl: ', err); // eslint-disable-line no-console
      windowUtils.send('set-video', {
        src: streamUrl,
        error: Boolean(err),
        strings: getLocaleStrings(opts.domain, isAudio),
        url: id ? '' : opts.url,
        player: player
      });
    }, opts.time);
  });
}
