const React = require('react');
const cn = require('classnames');
const keyboardJS = require('keyboardjs');
const ReactTooltip = require('react-tooltip');
const sendMetricsEvent = require('../client-lib/send-metrics-event');

module.exports = class SoundControl extends React.Component {
  constructor(props) {
    super(props);
    this.state ={
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
    const muteTooltip = !this.props.minimized ? (<ReactTooltip id='mute' effect='solid' place='bottom'>
                                                 {this.props.strings.ttMute}</ReactTooltip>) : null;
    const unmuteTooltip = !this.props.minimized ? (<ReactTooltip id='unmute' effect='solid' place='bottom'>
                                                   {this.props.strings.ttUnmute}</ReactTooltip>) : null;
    return (
        <div className={cn('sound-control', {hidden: !this.props.hovered && !this.props.minimized})}
             onMouseEnter={this.enterSound.bind(this)} onMouseLeave={this.leaveSound.bind(this)}>
          <a onClick={this.mute.bind(this)} data-tip data-for='mute'
             className={cn('mute', {hidden: this.props.muted})} />
          {muteTooltip}
          <a onClick={this.unmute.bind(this)} data-tip data-for='unmute'
             className={cn('unmute', {hidden: !this.props.muted})} />
          {unmuteTooltip}

          <div className={cn('volume', {hidden: !this.state.showVolume})}>
            <input type='range' orient={this.props.minimized ? '' : 'vertical'} min='0' max='1' step='.01'
                   value={this.props.muted ? 0 : this.props.volume}
                   onChange={this.setVolume.bind(this)}/>
          </div>
        </div>
    );
  }
}
