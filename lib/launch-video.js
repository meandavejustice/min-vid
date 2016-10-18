const getVideoId = require('get-video-id');
const panelUtils = require('./panel-utils');

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
    const id = getVideoId(opts.url);
    panel.port.emit('set-video', {
      domain: opts.domain,
      id: id,
      src: opts.src || '',
      volume: opts.volume,
      muted: opts.muted
    });
    panel.show();
    panelUtils.redraw(true);
    if (!opts.src) {
      opts.getUrlFn(id, function(err, streamUrl) {
        // Be careful not to close over the outer panel reference.
        // If the panel went away while waiting for the stream, just give up.
        const panel = panelUtils.getPanel();
        if (err) console.error('LaunchVideo failed to get the streamUrl: ', err); // eslint-disable-line no-console
        if (!panel) return console.error('LaunchVideo lost the panel while waiting for the streamUrl.'); // eslint-disable-line no-console
        panel.port.emit('set-video', {src: streamUrl, error: Boolean(err)});
        panel.show();
        panelUtils.redraw(true);
      }, opts.time);
    }
  });
}
