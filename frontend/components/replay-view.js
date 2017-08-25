import React from 'react';
import cn from 'classnames';
import sendToAddon from '../client-lib/send-to-addon';
import sendMetricsEvent from '../client-lib/send-metrics-event';

export default class ReplayView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasSetInitialPlayerState: false
    };
  }

  close() {
    sendMetricsEvent('replay_view', 'close', this.props.queue[0].domain);
    sendToAddon({action: 'close'});
  }

  playFromHistory() {
    sendMetricsEvent('replay_view', 'play-from-history', this.props.queue[0].domain);
    sendToAddon({action: 'play-from-history'});
  }

  startQueueCheck() {
    const interval = () => {
      if (this.props.exited && this.props.queue.length > 1) {
        window.AppData.set({exited: false});
        // only forward the track if 'add-to-queue' was selected,
        // if 'Play Now' was selected we want to play the first track
        // in queue. We detect this by checking the playing prop.
        if (!this.props.playing) this.props.nextTrack();
        window.AppData.set({playing: true});
      } else setTimeout(interval, 200);
    };

    if (!this.props.exited) return;

    // only set playing to false once, on initial load, otherwise
    // we end up in an ugly loop!
    if (!this.state.hasSetInitialPlayerState && this.props.exited) {
      this.setState({hasSetInitialPlayerState: true});
      window.AppData.set({playing: false});
    }

    interval();
  }

  render() {
    if (this.props.exited) this.startQueueCheck();

    const fromHistoryLink = this.props.history.length ? (<a className='play-from-history'
                                                         onClick={this.playFromHistory.bind(this)}>
                                                         Play from History?</a>) : null;
    return (
        <div className={cn('exited', {hidden: !this.props.exited || this.props.minimized})}>
          <div className='row'>
            <div className='ended-dialog'>
              <p>{this.props.strings.endOfQueue}. {fromHistoryLink}</p>
            </div>
            <button className='exit-replay' onClick={this.props.replay.bind(this)}></button>
            <button className='exit-close' onClick={this.close.bind(this)}></button>
          </div>
        </div>
    );
  }
}
