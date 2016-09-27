const React = require('react');
const cn = require('classnames');
const sendToAddon = require('../client-lib/send-to-addon');
const sendMetricsEvent = require('../client-lib/send-metrics-event');

module.exports = React.createClass({
  getView: function() {
    if (this.props.error) return 'error_view';
    return this.props.loaded ? 'player_view' : 'loading_view';
  },
  close: function() {
    sendMetricsEvent(this.getView(), 'close');
    sendToAddon({action: 'close'});
    window.AppData.minimized = false;
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
  },
  render: function() {
    return (
      <div className='right'>
        <a onClick={this.sendToTab} data-tip='Send to tab' className='tab' />
        <a className={cn('minimize', {hidden: this.props.minimized})}
          onClick={this.minimize} data-tip='Minimize' />
        <a onClick={this.maximize} data-tip='Maximize'
          className={cn('maximize', {hidden: !this.props.minimized})} />
        <a className='close' onClick={this.close} data-tip='Close' />
      </div>
    );
  }
});
