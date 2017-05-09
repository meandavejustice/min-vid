const tabs = require('sdk/tabs');
const qs = require('sdk/querystring');
const prefs = require('sdk/simple-prefs').prefs;
const store = require('sdk/simple-storage').storage;
const getVideoId = require('get-video-id');

const isAudio = require('./is-audio');
const windowUtils = require('./window-utils');
const getRandomId = require('./get-random-id');
const youtubeHelpers = require('./youtube-helpers');
const sendMetricsData = require('./send-metrics-data');
const getLocaleStrings = require('./get-locale-strings');

module.exports = launchVideo;

// Pass in a video URL as opts.src or pass in a video URL lookup function as opts.getUrlFn
function launchVideo(opts) {
  // UpdateWindow might create a new panel, so do the remaining launch work
  // asynchronously.
  windowUtils.updateWindow();
  windowUtils.whenReady(() => {
    const getUrlFn = opts.getUrlFn;
    const action = opts.action;

    delete opts.getUrlFn;
    delete opts.action;

    if (action === 'play') opts.playing = true;

    const trackIsAudio = (isAudio(opts.url) || new RegExp('^(https?:)?//soundcloud.com\/').exec(opts.url));

    windowUtils.show();
    // send some initial data to open the loading view
    // before we fetch the media source
    windowUtils.send('set-video', opts = Object.assign({
      id: getRandomId(),
      width: prefs.width,
      height: prefs.height,
      videoId: getVideoId(opts.url) ? getVideoId(opts.url).id : '',
      strings: getLocaleStrings(opts.domain, trackIsAudio),
      tabId: tabs.activeTab.id,
      launchUrl: opts.url,
      currentTime: 0,
      keyShortcutsEnabled: prefs['keyShortcutsEnabled'],
      confirm: false,
      confirmContent: '{}'
    }, opts));

    // YouTube playlist handling
    if (opts.domain === 'youtube.com' && !!~opts.url.indexOf('list')) {
      if (!!~opts.url.indexOf('watch?v')) {
        const parsed = qs.parse(opts.url.substr(opts.url.indexOf('?') + 1));
        youtubeHelpers.getPlaylistMeta({
          videoId: parsed.v,
          playlistId: parsed.list,
        }, (meta) => {
          opts.confirmContent = meta;
          opts.confirmContent.action = action;
          opts.confirmContent = JSON.stringify(opts.confirmContent);
          sendMetricsData({
            object: 'playlist',
            method: `launch:video:${action}`,
            domain: opts.domain
          });
          windowUtils.maximize();
          windowUtils.send('set-video', Object.assign(opts, {
            confirm: true,
            error: false,
            minimized: false,
            queue: JSON.stringify(store.queue),
            history: JSON.stringify(store.history)
          }));
        });
      } else {
        // only playlist handling
        const parsed = qs.parse(opts.url.substr(opts.url.indexOf('?') + 1));
        youtubeHelpers.getPlaylist({playlistId: parsed.list}, playlist => {
          if (action === 'play') {
            store.queue = playlist.concat(store.queue);
          } else store.queue = store.queue.concat(playlist);

          const response = {
            trackAdded: (action === 'add-to-queue') && (store.queue.length > 1),
            error: false,
            queue: JSON.stringify(store.queue),
            history: JSON.stringify(store.history)
          };

          sendMetricsData({
            object: 'playlist',
            method: `launch:${action}`,
            domain: opts.domain
          });

          if (action === 'play') response.playing = true;
          windowUtils.send('set-video', response);
        });
      }
    } else {
      // fetch the media source and set it
      getUrlFn(opts, function(item) {
        if (item.err) console.error('LaunchVideo failed to get the streamUrl: ', item.err); // eslint-disable-line no-console

        if (isAudio(item.url)) item.player = 'audio';

        if (action === 'play') store.queue.unshift(item);
        else store.queue.push(item);

        const videoOptions = {
          trackAdded: (action === 'add-to-queue') && (store.queue.length > 1),
          error: item.err ? item.err : false,
          queue: JSON.stringify(store.queue),
          history: JSON.stringify(store.history)
        };

        if (action === 'play') videoOptions.playing = true;
        windowUtils.send('set-video', videoOptions);
      });
    }
  });
}
