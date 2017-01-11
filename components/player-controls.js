const React = require('react');
const ReactTooltip = require('react-tooltip');
const cn = require('classnames');
const emitter = require('../client-lib/emitter');
const appData = require('../client-lib/app-data');

const GeneralControls = require('./general-controls');

class PlayerControls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showVolume: false};
  }

  enterControls() {
    this.setState({showVolume: true});
  }

  leaveControls() {
    this.setState({showVolume: false});
  }

  play() {
    if (this.props.exited) emitter.emit('replay');
    else emitter.emit('play');
  }

  pause() {
    emitter.emit('pause');
  }

  mute() {
    emitter.emit('mute');
  }

  unmute() {
    emitter.emit('unmute');
  }

  setVolume(ev) {
    const value = parseFloat(ev.target.value);
    const muted = (value === 0);

    emitter.emit('set-volume', {
      value: value
    });

    if (muted && !this.props.muted) {
      emitter.emit('mute');
    } else if (!muted && this.props.muted) {
      emitter.emit('unmute');
    }
  }

  setTime(ev) {
    ev.stopPropagation();
    const x = ev.pageX - ev.target.offsetLeft;
    const clickedValue = x * ev.target.max / ev.target.offsetWidth;
    const currentTime = appData.duration * clickedValue;

    emitter.emit('set-time', {
      value: currentTime
    });
  }

  render() {
    return (
        <div className={cn('controls drag', {hidden: !this.props.hovered, minimized: this.props.minimized})}
             onMouseEnter={this.enterControls.bind(this)} onMouseLeave={this.leaveControls.bind(this)}>
            <div className='left drag'>
              <a onClick={this.play.bind(this)} data-tip data-for='play'
                 className={cn('play', {hidden: this.props.playing})} />
              <ReactTooltip id='play' effect='solid' place='right'>{this.props.strings.ttPlay}</ReactTooltip>

              <a onClick={this.pause.bind(this)} data-tip data-for='pause'
                 className={cn('pause', {hidden: !this.props.playing})} />
              <ReactTooltip id='pause' effect='solid' place='right'>{this.props.strings.ttPause}</ReactTooltip>

              <a onClick={this.mute.bind(this)} data-tip data-for='mute'
                 className={cn('mute', {hidden: this.props.muted})} />
              <ReactTooltip id='mute' effect='solid' place={!this.props.minimized ? 'bottom': 'right'}>
                {this.props.strings.ttMute}
              </ReactTooltip>

              <a onClick={this.unmute.bind(this)} data-tip data-for='unmute'
                 className={cn('unmute', {hidden: !this.props.muted})} />
              <ReactTooltip id='unmute' effect='solid' place={!this.props.minimized ? 'bottom': 'right'}>
                {this.props.strings.ttUnmute}
              </ReactTooltip>

              <input type='range' className={cn('volume', {hidden: !this.state.showVolume})}
                     min='0' max='1' step='.01' value={this.props.muted ? 0 : this.props.volume}
                     onChange={this.setVolume.bind(this)}/>
            </div>

            <GeneralControls {...this.props} isYt={this.isYt} getTime={this.getTime}/>
          </div>
    );
  }
}

PlayerControls.propTypes = {
  muted: React.PropTypes.bool,
  exited: React.PropTypes.bool,
  volume: React.PropTypes.number,
  playing: React.PropTypes.bool,
  hovered: React.PropTypes.bool,
  strings: React.PropTypes.object,
  minimized: React.PropTypes.bool,
};

module.exports = PlayerControls;
