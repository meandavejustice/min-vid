const React = require('react');
const cn = require('classnames');
const sendToAddon = require('../client-lib/send-to-addon');
const sendMetricsEvent = require('../client-lib/send-metrics-event');

module.exports = class ReplayView extends React.Component {
  close() {
    sendMetricsEvent('replay_view', 'close');
    sendToAddon({action: 'close'});
  }

  playFromHistory() {
    sendMetricsEvent('replay_view', 'play-from-history');
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
