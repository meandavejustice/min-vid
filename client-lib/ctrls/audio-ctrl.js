const AudioSource = require('audiosource');
const FFT = require('audio-fft');
const context = new AudioContext();
const appData = require('../app-data');

module.exports = class AudioCtrl {
  constructor(options) {
    this.gainNode = context.createGain();
    this.gainNode.gain.value = 0.5;
    this.prevVolume = 0.5;

    const spacing = (options.canvas.width > 900) ? options.canvas.width / 500 : 1;

    // visuals
    this.fft = new FFT(context, {
      fillStyle: '#fff',
      strokeStyle: '#fff',
      canvas: options.canvas,
      type: 'time',
      width: spacing,
      spacing: spacing
    });

    const onConnect = () => {
      this.audio.source.connect(this.fft.input);
      this.audio.source.connect(this.gainNode);
      this.gainNode.connect(context.destination);
    };

    this.audio = new AudioSource({
      context: context,
      onConnect: onConnect
    });

    this.audio.load(options.src, (err) => {
      if (err) options.onError();
      options.onLoaded(this.duration);
    });
  }

  get volume() {
    return this.gainNode.gain.value;
  }

  set volume(v) {
    this.gainNode.gain.value = v;
  }

  get time() {
    return this.audio.time().current;
  }

  set time(t) {
    this.audio.play(t);
    if (!appData.playing) this.audio.pause();
  }

  get duration() {
    // TODO(DJ) ensure that buffer has loaded correctly before
    // fetching duration
    if (!this.audio.buffer) return 0;
    return this.audio.time().total;
  }

  play(t) {
    this.audio.play(t);
  }

  pause() {
    // TODO(DJ) ensure that source has loaded correctly before
    // calling pause.
    // meandavejustice/audiosource #5
    if (this.audio.source) this.audio.pause();
  }

  mute() {
    if (this.prevVolume !== 0) {
      this.prevVolume = this.volume;
    }
    this.volume = 0;
  }

  unmute() {
    this.volume = this.prevVolume;
  }

  remove() {
    this.fft.disconnect();
    this.gainNode.disconnect();
    if (!this.audio.buffer) return;
    this.audio.remove();
  }
}
