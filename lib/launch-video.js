const getVideoId = require('get-video-id');
const qs = require('sdk/querystring');
const panelUtils = require('./panel-utils.js');

module.exports = launchVideo;

// Pass in a video URL as opts.src or pass in a video URL lookup function as opts.getUrlFn
function launchVideo(opts) {
  // UpdateWindow might create a new panel, so do the remaining launch work
  // asynchronously.
  panelUtils.updateWindow();
  panelUtils.whenPanelReady(() => {
    const panel = panelUtils.getPanel();
    // opts {url: url,
    //       getUrlFn: getYouTubeUrl,
    //       domain: 'youtube.com',
    //       time: 16 // integer seconds OPTIONAL
    //       src: streamURL or ''}
    let id;

    // TODO: submit a fix to getVideoId for this. #226
    if (opts.url.indexOf('attribution_link') > -1) {
      id = getIdFromAttributionLink(opts.url);
    } else {
      id = getVideoId(opts.url);
    }

    panel.port.emit('set-video', {domain: opts.domain, id: id, src: opts.src || ''});
    panel.show();
    if (!opts.src) {
      opts.getUrlFn(id, function(err, streamUrl) {
        // Be careful not to close over the outer panel reference.
        // If the panel went away while waiting for the stream, just give up.
        const panel = panelUtils.getPanel();
        if (err) return console.error('LaunchVideo failed to get the streamUrl: ', err); // eslint-disable-line no-console
        if (!panel) return console.error('LaunchVideo lost the panel while waiting for the streamUrl.'); // eslint-disable-line no-console
        panel.port.emit('set-video', {src: streamUrl});
        panel.show();
      }, opts.time);
    }
  });
}

function getIdFromAttributionLink(url) {
  const matcher = 'attribution_link?';
  const idx = url.indexOf(matcher);
  const partialUrl = decodeURIComponent(url).substring(idx + matcher.length);
  const idMatcher = 'watch?';
  const idx2 = partialUrl.indexOf(idMatcher);
  return qs.parse(partialUrl.substring(idx2 + idMatcher.length)).v;
}
