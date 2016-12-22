const React = require('react');
const emitter = require('../client-lib/emitter');
const PlayerControls = require('../components/player-controls');
const ReplayView = require('../components/replay-view');
const Progress = require('../components/progress');

class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hovered: false};
  }

  onLoaded(duration) {
    clearTimeout(this.loadingTimeout);

    // for YouTube we need to detect if the duration is 0 to see
    // if there was a problem loading.
    if ((this.props.player === 'youtube') && duration === 0) this.onError();

    // here we store the muted prop before it gets set in the
    // setVolume call so we can restore it afterwards.
    const wasMuted = this.props.muted;

    // set initial volume
    emitter.emit('set-volume', {
      value: this.props.volume
    });

    // set muted/unmuted (must be called before setVolume below)
    if (wasMuted) {
      emitter.emit('mute')
    } else {
      emitter.emit('unmute')
    }

    emitter.emit('load', {duration: duration});
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.props.src) return;
    if (prevProps.src !== this.props.src) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = setTimeout(() => {
        emitter.emit('error');
      }, 20000); // 20 second timeout

      if (this.props.player === 'audio') {
        const canvas = this.refs['audio-vis'];
        if (canvas) emitter.emit('init', {
          src: this.props.src,
          canvas: canvas,
          onLoaded: this.onLoaded.bind(this),
          onError: this.onError.bind(this)
        });
      } else this.attachVideoListeners();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.loadingTimeout);
    this.removeVideoListeners();
  }

  attachVideoListeners() {
    if (!this.props.src) return;

    if (this.props.player === 'youtube') {
      emitter.emit('init', {
        onLoaded: this.onLoaded.bind(this)
      });
    } else {
      emitter.emit('init', {
        video: this.refs.video
      });
      this.refs.video.addEventListener('canplay', this.onLoaded.bind(this));
      this.refs.video.addEventListener('durationchange', this.onLoaded.bind(this));
      this.refs.video.addEventListener('error', this.onError.bind(this));
    }
  }

  removeVideoListeners() {
    this.refs.video.removeEventListener('canplay');
    this.refs.video.removeEventListener('durationchange');
    this.refs.video.removeEventListener('error');
  }

  onError() {
    if (!this.props.src) return;
    emitter.emit('error');
  }

  enterPlayer() {
    this.setState({hovered: true});
  }

  leavePlayer() {
    this.setState({hovered: false});
  }

  handleVideoClick(ev) {
    if (this.props.exited) return;
    if (!ev.target.classList.contains('video-wrapper') && (ev.target.id !== 'audio-vis')) return;
    if (this.props.playing) emitter.emit('pause')
    else emitter.emit('play')
  }

  render() {
    const noop = () => false;

    const audioEl = this.props.player === 'audio' ?
          (<canvas id='audio-vis' ref='audio-vis' onContextMenu={noop}
                   onClick={this.handleVideoClick.bind(this)}/>) : null;

    const visualEl = audioEl ? audioEl :
          (this.props.player === 'youtube') ?
          (<iframe id='video-yt' ref='video' src={this.props.src} onContextMenu={noop} />) :
          (<video id='video' ref='video' src={this.props.src} autoPlay={false}
                  onContextMenu={noop} muted={this.props.muted} volume={this.props.volume}
                  currentTime={this.props.currentTime} />);

    return (
        <div className='video-wrapper'
             onMouseEnter={this.enterPlayer.bind(this)}
             onMouseLeave={this.leavePlayer.bind(this)}
             onClick={this.handleVideoClick.bind(this)}>

          <PlayerControls {...this.props} hovered={this.state.hovered} />

          <ReplayView {...this.props} />
          <Progress {...this.props} hovered={this.state.hovered} />

          {visualEl}
        </div>
    );
  }
}

Player.propTypes = {
  src: React.PropTypes.string,
  muted: React.PropTypes.bool,
  exited: React.PropTypes.bool,
  playing: React.PropTypes.bool,
  volume: React.PropTypes.number,
  player: React.PropTypes.string,
  currentTime: React.PropTypes.number
};

module.exports = Player;
