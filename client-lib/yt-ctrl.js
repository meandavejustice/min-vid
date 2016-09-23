module.exports = {
  init: init,
  play: play,
  pause: pause,
  mute: mute,
  unmute: unmute,
  setVolume: setVolume,
  getVolume: getVolume,
  getTime: getTime,
  setTime: setTime,
  getDuration: getDuration,
  forceUpdateTime: forceUpdateTime
};

function init(id, opts) {
  if (!window.YT) return opts.onError('window.YT not yet initialized');

  window.YTPlayer = new window.YT.Player(id, {
    events: {
      onReady: opts.onReady,
      onError: opts.onError,
      onStateChange: opts.onStateChange
    }
  });
}

function play() {
  window.YTPlayer.playVideo();
}

function pause() {
  window.YTPlayer.pauseVideo();
}

function mute() {
  window.YTPlayer.mute();
}

function unmute() {
  window.YTPlayer.unMute();
}

// v:int
function setVolume(v) {
  window.YTPlayer.setVolume(v);
}

function getVolume() {
  return window.YTPlayer.getVolume();
}

function getTime() {
  return window.YTPlayer.getCurrentTime();
}

function setTime(seconds) {
  window.YTPlayer.seekTo(seconds, true);
}

function getDuration() {
  // #184 getDuration always seems to round up
  // whereas the player on YouTube always has
  // the float. This causes our ui to appear
  // as if it exits one second early.
  const dur = window.YTPlayer.getDuration();
  if (dur > 1) {
    return dur - 1;
  } else return dur;
}

// if the player is paused and setTime is
// called, the currentTime property is not
// updated until the video is played.
// So we force the update here by playing
// and pausing.
// https://github.com/meandavejustice/min-vid/issues/259
function forceUpdateTime() {
  play();
  pause();
}
