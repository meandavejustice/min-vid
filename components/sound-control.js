const React = require('react');
const cn = require('classnames');
const keyboardJS = require('keyboardjs');
const ReactTooltip = require('react-tooltip');
const sendMetricsEvent = require('../client-lib/send-metrics-event');

module.exports = class SoundControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showVolume: false,
      prevVolume: 0.5
    };
  }
  componentDidMount() {
    if (!this.props.keyShortcutsEnabled) return;
    // mute/unmute toggle keyboard shortcut
    keyboardJS.bind('m', ev => {
      if (window.AppData.muted) this.unmute();
      else this.mute();
    });

    keyboardJS.bind('up', ev => {
      if (window.AppData.muted) this.unmute();
      this.setVolume({
        target: {
          value: window.AppData.volume + .05
        }
      });
    });

    keyboardJS.bind('down', ev => {
      if (window.AppData.muted) return;
      this.setVolume({
        target: {
          value: window.AppData.volume - .05
        }
      });
    });
  }

  enterSound() {
    this.setState({showVolume: true});
  }

  leaveSound() {
    this.setState({showVolume: false});
  }

  mute() {
    sendMetricsEvent('player_view', 'mute');
    this.setState({prevVolume: this.props.volume});
    if (this.props.audio) this.props.audio.mute();
    window.AppData.set({muted: true, volume: 0});
  }

  unmute() {
    sendMetricsEvent('player_view', 'unmute');
    if (this.props.audio) this.props.audio.unmute();
    window.AppData.set({muted: false, volume: this.state.prevVolume});
  }

  setVolume(ev) {
    const value = parseFloat(ev.target.value);
    const muted = (value === 0);

    window.AppData.set({
      volume: ev.target.value
    });

    if (this.props.audio) this.props.audio.volume = value;

    if (muted && !this.props.muted) {
      window.AppData.set({muted: true});
    } else if (!muted && this.props.muted) {
      window.AppData.set({muted: false});
    }
  }

  render() {
    return (
        <div className={cn('sound-control', {hidden: !this.props.hovered && !this.props.minimized})}
             onMouseEnter={this.enterSound.bind(this)} onMouseLeave={this.leaveSound.bind(this)}>
          <a onClick={this.mute.bind(this)} data-tip data-for='mute'
             className={cn('mute', {hidden: this.props.muted})} />
          <ReactTooltip id='mute' effect='solid' place='left'>{this.props.strings.ttMute}</ReactTooltip>
          <a onClick={this.unmute.bind(this)} data-tip data-for='unmute'
             className={cn('unmute', {hidden: !this.props.muted})} />
          <ReactTooltip id='unmute' effect='solid' place='left'>{this.props.strings.ttUnmute}</ReactTooltip>

          <div className={cn('volume', {hidden: !this.state.showVolume && !this.props.minimized})}>
            <input type='range' orient={this.props.minimized ? '' : 'vertical'} min='0' max='1' step='.01'
                   value={this.props.muted ? 0 : this.props.volume}
                   onChange={this.setVolume.bind(this)}/>
          </div>
        </div>
    );
  }
}
