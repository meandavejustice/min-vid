const appData = require('../app-data');

module.exports = class YouTubeCtrl {
  constructor(options) {
    if (!window.YT) return options.onError('window.YT not yet initialized');

    window.YTPlayer = new window.YT.Player(options.id, {
      events: {
        onReady: options.onReady,
        onError: options.onError,
        onStateChange: options.onStateChange
      }
    });
  }

  get volume() {
    return window.YTPlayer.getVolume() / 100;
  }

  set volume(v) {
    window.YTPlayer.setVolume(v * 100);
  }

  get time() {
    return window.YTPlayer.getCurrentTime();
  }

  set time(seconds) {
    window.YTPlayer.seekTo(seconds, true);
  }

  get duration() {
    // #184 getDuration always seems to round up
    // whereas the player on YouTube always has
    // the float. This causes our ui to appear
    // as if it exits one second early.
    const dur = window.YTPlayer.getDuration();
    if (dur > 1) {
      return dur - 1;
    } else return dur;
  }

  play() {
    window.YTPlayer.playVideo();
  }

  pause() {
    // safeguard in case pause is called when the iframe
    // no longer exists.
    if (window.YTPlayer.a.contentWindow) window.YTPlayer.pauseVideo();
  }

  mute() {
    window.YTPlayer.mute();
  }

  unmute() {
    window.YTPlayer.unMute();

    appData.set({
      volume: this.volume
    });
  }

  remove() {
    window.YTPlayer = null;
  }
}
