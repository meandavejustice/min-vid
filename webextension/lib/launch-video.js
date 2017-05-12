import { parse } from './querystring';
import getVideoId from 'get-video-id';
import { send, prepareWindow } from './window-messages';
import youtubeHelpers from './youtube-helpers';
import sendMetricsData from './send-metrics-data';
import getLocaleStrings from './get-locale-strings';

import uuid from 'uuid/v1';

const store = browser.storage.local;

function isAudioFile(src) {
  const isSoundcloud = new RegExp('^(https?:)?//api.soundcloud.com\/tracks\/[0-9]+\/stream')
        .exec(src);
  const isAudioURL = new RegExp('^(https?:)?//*.+(.mp3|.opus|.weba|.ogg|.wav|.flac)')
        .exec(src);
  return Boolean(isSoundcloud || isAudioURL);
}

function isAudio(url) {
  return (isAudioFile(url) || new RegExp('^(https?:)?//soundcloud.com\/').exec(url) !== null);
}

// Pass in a video URL as opts.src or pass in a video URL lookup function as opts.getUrlFn
export default function launchVideo(opts) {
  prepareWindow();
  store.get().then(r => {
    const getUrlFn = opts.getUrlFn;
    const action = opts.action;

    delete opts.getUrlFn;
    delete opts.action;

    if (action === 'play') opts.playing = true;
    send(opts = Object.assign({
      id: uuid(),
      width: r.width,
      height: r.height,
      videoId: getVideoId(opts.url) ? getVideoId(opts.url).id : '',
      strings: getLocaleStrings(opts.domain, isAudio(opts.url)),
      // tabId: browser.tabs.TAB.id,
      launchUrl: opts.url,
      currentTime: 0,
      confirm: false,
      confirmContent: '{}'
    }, opts));

    // YouTube playlist handling
    if (opts.domain === 'youtube.com' && !!~opts.url.indexOf('list')) {
      if (!!~opts.url.indexOf('watch?v')) {
        const parsed = parse(opts.url.substr(opts.url.indexOf('?') + 1));
        youtubeHelpers.getPlaylistMeta({
          videoId: parsed.v,
          playlistId: parsed.list
        }, (meta) => {
          opts.confirmContent = meta;
          opts.confirmContent.action = action;
          opts.confirmContent = JSON.stringify(opts.confirmContent);
          sendMetricsData({
            object: 'confirm_view',
            method: `launch:video:${action}`,
            domain: opts.domain
          });
          send(Object.assign(opts, {
            confirm: true,
            error: false,
            minimized: false,
            queue: JSON.stringify(r.queue),
            history: JSON.stringify(r.history)
          }));
        });
      } else {
        // only playlist handling
        const parsed = parse(opts.url.substr(opts.url.indexOf('?') + 1));
        youtubeHelpers.getPlaylist({playlistId: parsed.list}, playlist => {
          if (action === 'play') {
            r.queue = playlist.concat(r.queue);
          } else r.queue = r.queue.concat(playlist);

          store.set({queue: r.queue, history: r.history});
          const response = {
            trackAdded: (action === 'add-to-queue') && (r.queue.length > 1),
            error: false,
            queue: JSON.stringify(r.queue),
            history: JSON.stringify(r.history)
          };

          sendMetricsData({
            object: 'confirm_view ',
            method: `launch:playlist:${action}`,
            domain: opts.domain
          });

          if (action === 'play') response.playing = true;
          send(response);
        });
      }
    } else {
      // fetch the media source and set it
      getUrlFn(opts, function(item) {
        if (item.error) console.error('LaunchVideo failed to get the streamUrl: ', item.error); // eslint-disable-line no-console

        if (isAudio(item.url)) item.player = 'audio';

        if (action === 'play') r.queue.unshift(item);
        else r.queue.push(item);

        // add the list of queue after the play not before
        if (item.addToQueue) {
          for (let i = 0; i < item.addToQueue.length; ++i) {
            if (isAudio(item.addToQueue[i].url)) item.addToQueue[i].player = 'audio';
            r.queue.push(item.addToQueue[i]);
          }
          delete item.addToQueue; // clean list
        }

        store.set({queue: r.queue});
        const videoOptions = {
          trackAdded: (action === 'add-to-queue') && (r.queue.length > 1),
          error: item.error ? item.error : false,
          queue: JSON.stringify(r.queue),
          history: JSON.stringify(r.history)
        };

        if (action === 'play') videoOptions.playing = true;
        send(videoOptions);
      });
    }
  });
}
