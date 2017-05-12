import youtubeHelpers from './youtube-helpers';
import { send, close, minimize, maximize } from './window-messages';
import sendMetricsData from './send-metrics-data';

const store = browser.storage.local;

export default function(msg) {
  const title = msg.action;
  const opts = msg;
  if (title === 'send-to-tab') {
    const pageUrl = opts.launchUrl ? opts.launchUrl : getPageUrl(opts.domain, opts.id, opts.time);
    if (pageUrl) browser.tabs.create({url: pageUrl});
    else {
      console.error('could not parse page url for ', opts); // eslint-disable-line no-console
      send({error: 'Error loading video from ' + opts.domain});
    }
    send({domain: '', src: ''});
    close();
  } else if (title === 'close') {
    store.get().then(r => {
      r.history.unshift(r.queue.shift());
      store.set({history: r.history, queue: r.queue});
    });
    send({domain: '', src: ''});
    close();
  } else if (title === 'minimize') {
    minimize();
  } else if (title === 'maximize') {
    maximize();
  } else if (title === 'metrics-event') {
    // Note: sending in the window ref to avoid circular imports.
    sendMetricsData(opts.payload);
  } else if (title === 'track-ended') {
    store.get().then(r => {
      r.history.unshift(r.queue.shift());
      store.set({history: r.history, queue: r.queue});
      if (r.queue.length) {
        send({
          playing: true,
          queue: JSON.stringify(r.queue),
          history: JSON.stringify(r.history)
        });
      }
    });
  } else if (title === 'track-removed') {
    store.get().then(r => {
      if (opts.isHistory) r.history.splice(opts.index, 1);
      else r.queue.splice(opts.index, 1);

      store.set({queue: r.queue, history: r.history});
      if (r.queue.length) {
        send({
          queue: JSON.stringify(r.queue),
          history: JSON.stringify(r.history)
        });
      } else {
        send({domain: '', src: ''});
        close();
      }
    });
  } else if (title === 'track-added-from-history') {
    store.get().then(r => {
      // In this case we should duplicate the item from the history
      // array.
      r.queue.push(r.history[opts.index]);
      sendMetricsData({
        object: 'queue_view',
        method: 'track-added-from-history',
        domain: r.queue[0].domain
      });
      store.set({queue: r.queue});
      send({queue: JSON.stringify(r.queue)});
    });
  } else if (title === 'track-expedited') {
    store.get().then(r => {
      /*
       * the goal here is to get the track index, move it to the top
       * of the queue, and play it.
       * We also need to handle the currently playing track correctly.

       * If track 0 in the queue is not playing, and hasn't been
       * played at all(currentTime == 0), we should move the newTrack
       * to the top of the queue and play it.

       * If track 0 in the queue is playing or has been played
       * (currentTime > 0), we should move track 0 into the history
       * array, and then move newTrack to the top of the queue
       */
      if (opts.moveIndexZero) {
        r.history.unshift(r.queue.shift());
        if (opts.isHistory) opts.index++;
        else opts.index--;
      }

      if (opts.isHistory) {
        r.queue.unshift(r.history[opts.index]);
      } else r.queue.unshift(r.queue.splice(opts.index, 1)[0]);

      sendMetricsData({
        object: 'queue_view',
        method: 'track-expedited',
        domain: r.queue[0].domain
      });

      store.set({queue: r.queue, history: r.history});
      send({
        playing: true,
        queue: JSON.stringify(r.queue),
        history: JSON.stringify(r.history)
      });
    });
  } else if (title === 'track-reordered') {
    store.get().then(r => {
      const newQueue = r.queue.slice();
      newQueue.splice(opts.newIndex, 0, newQueue.splice(opts.oldIndex, 1)[0]);
      store.set({queue: newQueue});
      store.queue = newQueue;
      sendMetricsData({
        object: 'queue_view',
        method: 'track-reordered',
        domain: newQueue[0].domain
      });
      send({queue: JSON.stringify(newQueue)});
    });
  } else if (title === 'play-from-history') {
    store.get().then(r => {
      r.queue.splice(0);
      r.queue = r.history.slice(0, 10);
      store.set({queue: r.queue});
      send({
        playing: true,
        exited: false,
        queue: JSON.stringify(r.queue)
      });
    });
  } else if (title === 'clear') {
    sendMetricsData({
      object: 'queue_view',
      method: `clear:${opts.choice}`,
      domain: ''
    });
    if (opts.choice === 'history') {
      store.set({history: []});
      send({history: JSON.stringify([])});
    } else {
      store.set({queue: []});
      send({domain: '', src: '', queue: JSON.stringify([])});
      close();
    }
  } else if (title === 'confirm') {
    store.get().then(r => {
      if (opts.choice === 'playlist') {
        youtubeHelpers.getPlaylist(opts, playlist => {

          // if the playlist was launched on with a certain video
          // we need to grab the playlist at that playlist
          if (opts.index) playlist = playlist.splice(opts.index - 1);

          if (opts.playerMethod === 'play') {
            // if the 'play-now' option was selected, and min vid has a
            // track playing we need to move that item to history before
            // front loading the playlist results into the queue.
            if (opts.moveIndexZero) r.history.unshift(r.queue.shift());
            r.queue = playlist.concat(r.queue);
          } else r.queue = r.queue.concat(playlist);

          store.set({queue: r.queue, history: r.history});
          const response = {
            trackAdded: (opts.playerMethod === 'add-to-queue') && (r.queue.length > 1),
            error: false,
            queue: JSON.stringify(r.queue),
            history: JSON.stringify(r.history),
            confirm: false,
            confirmContent: '{}'
          };

          if (opts.playerMethod === 'play') response.playing = true;
          send(response);
        });
      } else if (opts.choice === 'cancel') {
        if (!r.queue.length) {
          send({
            domain: '',
            src: '',
            confirm: false,
            confirmContent: '{}'
          });
          close();
        } else {
          send({
            confirm: false,
            confirmContent: '{}'
          });
        }
      } else {
        youtubeHelpers.getVideo(opts, video => {
          if (opts.playerMethod === 'play') {
            // if the 'play-now' option was selected, and min vid has a
            // track playing we need to move that item to history before
            // front loading the video into the queue.
            if (opts.moveIndexZero) r.history.unshift(r.queue.shift());
            r.queue.unshift(video);
          } else r.queue.push(video);

          store.set({queue: r.queue, history: r.history});
          const response = {
            trackAdded: (opts.playerMethod === 'add-to-queue') && (r.queue.length > 1),
            error: false,
            queue: JSON.stringify(r.queue),
            history: JSON.stringify(r.history),
            confirm: false,
            confirmContent: '{}'
          };

          if (opts.playerMethod === 'play') response.playing = true;

          send(response);
        });
      }
    });
  }
}

function getPageUrl(domain, id, time) {
  let url;
  if (domain.indexOf('youtube') > -1) {
    url = `https://youtube.com/watch?v=${id}&t=${Math.floor(time)}`;
  } else if (domain.indexOf('vimeo') > -1) {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time - min * 60);
    url = `https://vimeo.com/${id}#t=${min}m${sec}s`;
  }

  return url;
}
