import React from 'react';
import cn from 'classnames';
import debounce from 'lodash.debounce';
import ReactTooltip from 'react-tooltip';
import sendMetricsEvent from '../client-lib/send-metrics-event';

export default class PlaybackControl extends React.Component {
  play() {
    if (this.props.exited) {
      sendMetricsEvent('player_view', 'replay', '');
      this.props.replay();
      return;
    }
    if (this.props.audio) {
      this.props.audio.play();
      // only send event here if audio, since the same event is sent
      // in player_view in the onPlay method for videos.
      sendMetricsEvent('player_view', 'play', this.props.queue[0].domain);
    }
    window.AppData.set({playing: true});
  }

  pause() {
    if (this.props.audio) {
      this.props.audio.pause();
      // only send event here if audio, since the same event is sent
      // in player_view in the onPause method for videos.
      sendMetricsEvent('player_view', 'pause', this.props.queue[0].domain);
    }
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
