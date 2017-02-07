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

  render() {
    const fromHistoryLink = this.props.history.length ? (<a className='play-from-history'
                                                         onClick={this.playFromHistory.bind(this)}>
                                                         Play from History?</a>) : null;
    return (
        <div className={cn('exited', {hidden: !this.props.exited || this.props.minimized})}>
          <div className='row'>
            <div className='ended-dialog'>
              <p>There are no more songs in the queue. {fromHistoryLink}</p>
            </div>
            <button className='exit-replay' onClick={this.props.replay.bind(this)}></button>
            <button className='exit-close' onClick={this.close.bind(this)}></button>
          </div>
        </div>
    );
  }
}
