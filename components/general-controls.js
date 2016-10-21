const React = require('react');
const cn = require('classnames');
const deepAssign = require('deep-assign');
const sendToAddon = require('../client-lib/send-to-addon');
const sendMetricsEvent = require('../client-lib/send-metrics-event');
const ReactTooltip = require('react-tooltip');

function resetPlayer() {
  window.AppData = deepAssign(window.AppData, {
    error: false
  });
}

module.exports = React.createClass({
  getView: function() {
    if (this.props.error) return 'error_view';
    return this.props.loaded ? 'player_view' : 'loading_view';
  },
  close: function() {
    sendMetricsEvent(this.getView(), 'close');
    sendToAddon({action: 'close'});
    resetPlayer();
  },
  minimize: function() {
    sendMetricsEvent(this.getView(), 'minimize');
    sendToAddon({action: 'minimize'});
    window.AppData.minimized = true;
  },
  maximize: function() {
    sendMetricsEvent(this.getView(), 'maximize');
    sendToAddon({action: 'maximize'});
    window.AppData.minimized = false;
  },
  sendToTab: function() {
    sendMetricsEvent(this.getView(), 'send_to_tab');
    let currentTime = 0;

    if (this.getView() === 'player_view') {
      currentTime = this.props.getTime();
    }

    sendToAddon({
      action: 'send-to-tab',
      id: this.props.id,
      domain: this.props.domain,
      time: currentTime
    });
    resetPlayer();
  },
  render: function() {
    return (
      <div className='right'>
        <a onClick={this.sendToTab} data-tip data-for='sendToTab' className='tab'/>
        <ReactTooltip id='sendToTab' effect='solid' place={!this.props.minimized ? 'bottom': 'left'}>
          {this.props.strings.ttSendToTab}
        </ReactTooltip>

        <a className={cn('minimize', {hidden: this.props.minimized})}
           onClick={this.minimize} data-tip data-for='minimize' />
        <ReactTooltip id='minimize' effect='solid' place='left'>{this.props.strings.ttMinimize}</ReactTooltip>

        <a className={cn('maximize', {hidden: !this.props.minimized})}
           onClick={this.maximize} data-tip data-for='maximize' />
        <ReactTooltip id='maximize' effect='solid' place='left'>{this.props.strings.ttMaximize}</ReactTooltip>

        <a className='close' onClick={this.close} data-tip data-for='close' />
        <ReactTooltip id='close' effect='solid' place='left'>{this.props.strings.ttClose}</ReactTooltip>
      </div>
    );
  }
});
