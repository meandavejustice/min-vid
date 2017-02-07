const appData = require('./app-data');
const emitter = require('./emitter');
const formatTime = require('./format-time');
const sendToAddon = require('./send-to-addon');
const sendMetricsEvent = require('./send-metrics-event');

const YtCtrl = require('./ctrls/yt-ctrl');
const AudioCtrl = require('./ctrls/audio-ctrl');
const VideoCtrl = require('./ctrls/video-ctrl');

let currentStep, playerMap = {}; // eslint-disable-line no-unused-vars

function step() {
  let currentTime = 0;
  let progress = appData.progress;
  let duration = 0;

  if (playerMap[appData.player]) {
    currentTime = playerMap[appData.player].time;
    progress = (currentTime / playerMap[appData.player].duration) || appData.progress;
    duration = playerMap[appData.player].duration;
  }

  appData.set({
    currentTime: currentTime,
    time: `${formatTime(currentTime)} / ${formatTime(duration)}`,
    progress: progress,
    duration: duration
  });

  if (currentTime >= appData.duration) {
    appData.set({
      playing: false,
      exited: currentTime ? true : false
    });

    sendMetricsEvent('player_view', 'video_ended');
  }

  if (appData.playing) currentStep = requestAnimationFrame(step);
}

emitter.on('reset', () => {
  currentStep = null;
  Object.keys(playerMap).forEach((k) => {
    if (playerMap[k]) playerMap[k].pause();
  });

  appData.set({
    currentTime: 0,
    playing: false,
    error: false,
    exited: false,
    time: `${formatTime(0)} / ${formatTime(appData.duration)}`,
    progress: 0.001
  });
})

emitter.on('init', (opts) => {
  sendMetricsEvent('player_view', 'init');

  // remove existing player before initializing
  if (playerMap[appData.player]) playerMap[appData.player].remove();

  if (appData.player === 'audio') {
    playerMap['audio'] = new AudioCtrl(opts);
  } else if (appData.player === 'youtube') {
    const PLAYING = window.YT.PlayerState.PLAYING;
    const PAUSED = window.YT.PlayerState.PAUSED;

    playerMap['youtube'] = new YtCtrl({
      id: 'video-yt',
      onReady: (ev) => {opts.onLoaded(ev.target.getDuration())},
      onStateChange: (ev) =>  {
        if (ev.data === PLAYING && !appData.playing) emitter.emit('play')
        else if (ev.data === PAUSED && appData.playing) emitter.emit('pause')
      },
      onError: (err) => {
        let msg = true;
        if (err.data === 150 || err.data === 101) msg = 'errorYTNotAllowed';
        else if (err.data === 100) msg = 'errorYTNotFound';

        emitter.emit('error', {
          msg: msg
        });
      }
    });
  } else {
    playerMap['video'] = new VideoCtrl(opts);
  }
});

emitter.on('play', (opts) => {
  sendMetricsEvent('player_view', 'play');
  // TODO(DJ): this is a special case to handle audio replays
  // meandavejustice/audiosource #6
  if (opts && opts.replay) {
    playerMap[appData.player].play(0.001);
  } else playerMap[appData.player].play();

  appData.set({playing: true});
  currentStep = requestAnimationFrame(step);
});

emitter.on('pause', (opts) => {
  sendMetricsEvent('player_view', 'pause');
  playerMap[appData.player].pause();
  appData.set({playing: false});
});

emitter.on('mute', (opts) => {
  sendMetricsEvent('player_view', 'mute');
  playerMap[appData.player].mute();
  appData.set({muted: true});
});

emitter.on('unmute', (opts) => {
  sendMetricsEvent('player_view', 'unmute');
  playerMap[appData.player].unmute();
  appData.set({muted: false});
});

emitter.on('replay', (opts) => {
  sendMetricsEvent('player_view', 'replay');
  emitter.emit('reset');
  emitter.emit('play', {replay: true});
});

emitter.on('load', (opts) => {
  sendMetricsEvent('player_view', 'video_loaded');

  // initial step to set times
  step();

  appData.set({
    loaded: true,
    duration: opts.duration
  });
});

emitter.on('set-volume', (opts) => {
  playerMap[appData.player].volume = opts.value;
  appData.set({
    volume: opts.value
  });
});

emitter.on('set-time', (opts) => {
  playerMap[appData.player].time = opts.value;

  // if we are paused force the ui to update
  if (!appData.playing) {
    appData.set({
      time: `${formatTime(opts.value)} / ${formatTime(appData.duration)}`,
      progress: opts.value / appData.duration,
      currentTime: opts.value
    });
  }
});

emitter.on('update-visual', (opts) => {
  if (appData.player !== 'audio') return;

  if (appData.visual === 'time') {
    appData.set({
      visual: playerMap[appData.player].visual = 'frequency'
    });
  } else {
    appData.set({
      visual: playerMap[appData.player].visual = 'time'
    });
  }
});

emitter.on('resize', (opts) => {
  if (appData.player !== 'audio') return;
  const spacing = (opts.width < 1000) ? 1 : opts.width / 500;
  playerMap[appData.player].fft.width = spacing;
  playerMap[appData.player].fft.spacing = spacing;
});

emitter.on('close', () => {
  sendMetricsEvent(getView(), 'close');
  if (playerMap[appData.player]) {
    playerMap[appData.player].remove();
  }
  playerMap = {};
  sendToAddon({action: 'close'});
});

emitter.on('minimize', () => {
  sendMetricsEvent(getView(), 'minimize');
  sendToAddon({action: 'minimize'});
  appData.minimized = true;
});

emitter.on('maximize', () => {
  sendMetricsEvent(getView(), 'maximize');
  sendToAddon({action: 'maximize'});
  appData.minimized = false;
});

emitter.on('send-to-tab', () => {
  sendMetricsEvent(getView(), 'send_to_tab');
  let currentTime = 0;

  if (getView() === 'player_view') {
    currentTime = appData.time;
  }

  sendToAddon({
    action: 'send-to-tab',
    id: appData.id,
    domain: appData.domain,
    time: currentTime,
    tabId: appData.tabId,
    url: appData.url
  });
  appData.set({error: false});
});

emitter.on('error', (opts) => {
  const msg = opts.msg ? opts.msg : true;
  appData.set({error: msg});
});

function getView() {
  if (appData.error) return 'error_view';
  return appData.loaded ? 'player_view' : 'loading_view';
}
