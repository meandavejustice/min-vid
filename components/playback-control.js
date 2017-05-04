const React = require('react');
const cn = require('classnames');
const debounce = require('lodash.debounce');
const ReactTooltip = require('react-tooltip');
const sendMetricsEvent = require('../client-lib/send-metrics-event');

module.exports = class PlaybackControl extends React.Component {
  play() {
    if (this.props.exited) {
      return this.props.replay();
    }
    sendMetricsEvent('player_view', 'play');
    if (this.props.audio) this.props.audio.play();
    window.AppData.set({playing: true});
  }

  pause() {
    sendMetricsEvent('player_view', 'pause');
    if (this.props.audio) this.props.audio.pause();
    window.AppData.set({playing: false});
  }

  render() {
    return (
        <div className={cn('playback-button', {hidden: !this.props.hovered && !this.props.minimized})}>
        <a onClick={debounce(this.play.bind(this), 100)} data-tip data-for='play'
          className={cn('play', {hidden: this.props.playing})} />
        <ReactTooltip id='play' effect='solid' place='right'>{this.props.strings.ttPlay}</ReactTooltip>
        <a onClick={debounce(this.pause.bind(this), 100)} data-tip data-for='pause'
          className={cn('pause', {hidden: !this.props.playing})} />
        <ReactTooltip id='pause' effect='solid' place='right'>{this.props.strings.ttPause}</ReactTooltip>
        </div>
    );
  }
}
