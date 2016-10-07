const getVideoId = require('get-video-id');
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
    windowUtils.show();
    windowUtils.send('set-video', {
      domain: opts.domain,
      id: id,
      src: opts.src || '',
      volume: opts.volume || 0.5,
      muted: opts.muted || false,
      strings: getLocaleStrings(opts.domain),
      tabId: require('sdk/tabs').activeTab.id
    });
    if (!opts.src) {
      opts.getUrlFn(id, function(err, streamUrl) {
        if (err) console.error('LaunchVideo failed to get the streamUrl: ', err); // eslint-disable-line no-console
        windowUtils.send('set-video', {
          src: streamUrl, error: Boolean(err),
          strings: getLocaleStrings(opts.domain)
        });
      }, opts.time);
    }
  });
}
