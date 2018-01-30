import getVideoId from 'get-video-id';
import { send, prepareWindow } from './window-messages';
import getLocaleStrings from './get-locale-strings';

import uuid from 'uuid/v1';

const store = browser.storage.local;

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
      strings: getLocaleStrings(opts.domain, false),
      // tabId: browser.tabs.TAB.id,
      launchUrl: opts.url,
      currentTime: 0,
      confirm: false,
      confirmContent: '{}'
    }, opts));

    // fetch the media source and set it
    getUrlFn(opts, function(item) {
      if (item.error) console.error('LaunchVideo failed to get the streamUrl: ', item.error); // eslint-disable-line no-console

      if (action === 'play') r.queue.unshift(item);
      else r.queue.push(item);

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
  });
}
