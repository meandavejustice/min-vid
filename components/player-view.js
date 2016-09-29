const React = require('react');
const ReactTooltip = require('react-tooltip');
const cn = require('classnames');

const ytCtrl = require('../client-lib/yt-ctrl');
const sendMetricsEvent = require('../client-lib/send-metrics-event');
const sendToAddon = require('../client-lib/send-to-addon');
const GeneralControls = require('./general-controls');

function formatTime(seconds) {
  const now = new Date(seconds * 1000);
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000));
  return utc.toLocaleTimeString('en-US', {hour12: false})
    .replace(/^00:/, '') // Strip leading "00:" if hours is empty.
    .replace(/^0/, '');  // Strip leading "0" in minutes, if any.
}

module.exports = React.createClass({
  getInitialState: function() {
    return {showVolume: false, hovered: false};
  },
  step: function() {
    const currentTime = this.isYt ? ytCtrl.getTime() : this.refs.video.currentTime;

    window.AppData = Object.assign(window.AppData, {
      currentTime: `${formatTime(currentTime)} / ${formatTime(window.AppData.duration)}`,
      progress: currentTime / window.AppData.duration
    });

    if (currentTime >= window.AppData.duration) {
      window.AppData = Object.assign(window.AppData, {
        playing: false
      });

      sendMetricsEvent('player_view', 'video_ended');
    }

    if (window.AppData.playing) requestAnimationFrame(this.step);
  },
  onLoaded: function() {
    clearTimeout(this.loadingTimeout);
    sendMetricsEvent('player_view', 'video_loaded');
    const duration = this.isYt ? ytCtrl.getDuration() : this.refs.video.duration;

    // for YouTube we need to detect if the duration is 0 to see
    // if there was a problem loading.
    if (this.isYt && duration === 0) {
      window.AppData = Object.assign(window.AppData, {error: true});
    }

    // here we store the muted prop before it gets set in the
    // setVolume call so we can restore it afterwards.
    const wasMuted = this.props.muted;

    // set initial volume
    this.setVolume({
      target: {
        value: this.props.volume
      }
    });

    // set muted/unmuted (must be called before setVolume below)
    if (wasMuted) {
      this.mute();
    } else {
      this.unmute();
    }


    window.AppData = Object.assign(window.AppData, {
      loaded: true,
      duration: duration
    });

    requestAnimationFrame(this.step);
  },
  componentWillUpdate: function() {
    this.isYt = !!~this.props.domain.indexOf('youtube.com');
  },
  componentDidUpdate: function(prevProps, prevState) {
    if (prevProps.src !== this.props.src) {
      this.attachVideoListeners();
    }
  },
  attachVideoListeners: function() {
    if (!this.props.src) return;

    this.loadingTimeout = setTimeout(function() {
      window.AppData.error = true;
    }, 30000); // 30 second timeout

    if (this.isYt) {
      const PLAYING = window.YT.PlayerState.PLAYING;
      const PAUSED = window.YT.PlayerState.PAUSED;

      ytCtrl.init('video', {
        onReady: this.onLoaded,
        onStateChange: (ev) => {
          if (ev.data === PLAYING && !this.props.playing) this.play();
          else if (ev.data === PAUSED && this.props.playing) this.pause();
        },
        onError: (err) => {
          const url = `https://youtube.com/watch?v=${this.props.id}`;
          window.AppData.error = `There was an error loading your video from ${url}`;
          console.error('Error: ytCtrl: ', err); // eslint-disable-line no-console
        }
      });
    }
    this.refs.video.addEventListener('canplay', this.onLoaded);
    this.refs.video.addEventListener('durationchange', this.onLoaded);
  },
  play: function() {
    if (this.hasExited() && !this.isYt) {
      if (!this.isYt) {
        return this.replay();
      } else {
        sendMetricsEvent('player_view', 'replay');
      }
    }
    sendMetricsEvent('player_view', 'play');
    if (this.isYt) {
      ytCtrl.play();
    } else {
      this.refs.video.play();
    }
    window.AppData.playing = true;
    requestAnimationFrame(this.step);
  },
  pause: function() {
    sendMetricsEvent('player_view', 'pause');
    if (this.isYt) {
      ytCtrl.pause();
    } else {
      this.refs.video.pause();
    }

    window.AppData.playing = false;
  },
  mute: function() {
    sendMetricsEvent('player_view', 'mute');

    if (this.isYt) {
      ytCtrl.mute();
    } else {
      this.refs.video.muted = true;
    }

    window.AppData = Object.assign(window.AppData, {muted: true});
  },
  clickedUnmute: function() {
    let volumeEvt = {target: {value: '0.5'}};
    // bump volume up to 50% if less than 5% since it is likely
    // if the volume is < 5%, that the user dragged the volume
    // slider down to 0% in order to mute.
    if (parseInt(window.AppData.volume, 10) > 0.05) {
      volumeEvt = {target: {value: window.AppData.volume}};
    }

    this.setVolume(volumeEvt);

    this.unmute();
  },
  unmute: function() {
    sendMetricsEvent('player_view', 'unmute');

    if (this.isYt) {
      ytCtrl.unmute();
    } else {
      this.refs.video.muted = false;
    }

    window.AppData = Object.assign(window.AppData, {muted: false});
  },
  setVolume: function(ev) {
    const value = parseFloat(ev.target.value);
    const muted = (value === 0);

    if (this.isYt) {
      ytCtrl.setVolume(value * 100);
    } else {
      this.refs.video.volume = value;
    }

    window.AppData = Object.assign(window.AppData, {
      volume: value
    });

    if (muted && !this.props.muted) {
      this.mute();
    } else if (!muted && this.props.muted) {
      this.unmute();
    }
  },
  setTime: function(ev) {
    ev.stopPropagation();
    const x = ev.pageX - ev.target.offsetLeft;
    const clickedValue = x * ev.target.max / ev.target.offsetWidth;
    const currentTime = window.AppData.duration * clickedValue;

    if (this.isYt) {
      ytCtrl.setTime(currentTime);
    } else {
      this.refs.video.currentTime = currentTime;
    }

    // if we are paused force the ui to update
    if (!this.props.playing) {
      window.AppData = Object.assign(window.AppData, {
        currentTime: `${formatTime(currentTime)} / ${formatTime(window.AppData.duration)}`,
        progress: currentTime / window.AppData.duration
      });
    }
  },
  replay: function() {
    sendMetricsEvent('player_view', 'replay');
    this.refs.video.currentTime = 0;
    this.step(); // step once to set currentTime of window.AppData and progress
    this.play();
  },
  close: function() {
    sendMetricsEvent('player_view', 'close');

    sendToAddon({action: 'close'});
    // reset error view
    window.AppData = Object.assign(window.AppData, {
      error: false
    });
  },
  enterControls: function() {
    this.setState({showVolume: true});
  },
  leaveControls: function() {
    this.setState({showVolume: false});
  },
  enterPlayer: function() {
    this.setState({hovered: true});
  },
  leavePlayer: function() {
    this.setState({hovered: false});
  },
  hasExited: function() {
    if (!this.refs.video || !window.AppData.loaded) return false;
    const currentTime = (this.isYt && window.YTPlayer) ? ytCtrl.getTime() : this.refs.video.currentTime;
    return (!this.props.playing && (currentTime >= this.props.duration));
  },
  getTime: function() {
    return this.isYt ? ytCtrl.getTime() : this.refs.video.currentTime;
  },
  handleVideoClick: function(ev) {
    if (!ev.target.classList.contains('video-wrapper')) return;
    if (this.props.playing) this.pause();
    else this.play();
  },
  render: function() {
    const noop = () => false;
    const videoEl = this.isYt ?
          (<iframe id='video' ref='video' src={this.props.src} onContextMenu={noop} />) :
          (<video id='video' ref='video' src={this.props.src} autoplay={false} onContextMenu={noop}/>);

    return (
        <div className='video-wrapper' onMouseEnter={this.enterPlayer}
             onMouseLeave={this.leavePlayer} onClick={this.handleVideoClick}>
          <div className={cn('controls', {hidden: !this.state.hovered, minimized: this.props.minimized})}
               onMouseEnter={this.enterControls} onMouseLeave={this.leaveControls}>
            <div className='left'>
              <ReactTooltip place='bottom' effect='solid' />

              <a onClick={this.play} data-tip='Play'
                 className={cn('play', {hidden: this.props.playing})} />
              <a onClick={this.pause} data-tip='Pause'
                 className={cn('pause', {hidden: !this.props.playing})} />
              <a onClick={this.mute} data-tip='Mute'
                 className={cn('mute', {hidden: this.props.muted})} />
              <a onClick={this.clickedUnmute} data-tip='Unmute'
                 className={cn('unmute', {hidden: !this.props.muted})} />
              <input type='range' className={cn('volume', {hidden: !this.state.showVolume})}
                     min='0' max='1' step='.01' value={this.props.muted ? 0 : this.props.volume}
                     onChange={this.setVolume}/>
            </div>

            <GeneralControls {...this.props} isYt={this.isYt} getTime={this.getTime}/>
          </div>

          <div className={cn('exited', {hidden: !this.hasExited() || this.props.minimized})}>
            <div className='row'>
              <button className='exit-replay' onClick={this.replay}></button>
              <button className='exit-close' onClick={this.close}></button>
            </div>
          </div>

          <div className={cn('progress', {hidden: !this.state.hovered || this.props.minimized})}>
            <span className='domain'>{this.props.domain}</span>
            <div className='time'>{this.props.currentTime}</div>
            <progress className='video-progress' onClick={this.setTime}
                      value={this.props.progress + ''}  />
          </div>

          {videoEl}
        </div>
    );
  }
});
