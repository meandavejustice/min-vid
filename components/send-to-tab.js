const React = require('react');
const ReactTooltip = require('react-tooltip');
const sendToAddon = require('../client-lib/send-to-addon');
const sendMetricsEvent = require('../client-lib/send-metrics-event');

function getView() {
  if (window.AppData.error) return 'error_view';
  return window.AppData.loaded ? 'player_view' : 'loading_view';
}

module.exports = class SendToTab extends React.Component {
  sendToTab() {
    sendMetricsEvent(getView(), 'send_to_tab');
    let currentTime = 0;

    if (getView() === 'player_view') {
      currentTime = window.AppData.currentTime;
    }

    sendToAddon({
      action: 'send-to-tab',
      id: window.AppData.queue[0].videoId,
      launchUrl: window.AppData.queue[0].launchUrl,
      domain: window.AppData.queue[0].domain,
      time: currentTime,
      tabId: window.AppData.tabId,
      url: window.AppData.queue[0].url
    });
  }

  render() {
    return (
        <div>
        <a onClick={this.sendToTab.bind(this)} data-tip data-for='sendToTab' className='tab'/>
        <ReactTooltip id='sendToTab' effect='solid' place={!this.props.minimized ? 'bottom' : 'left'}>
        {this.props.strings.ttSendToTab}
      </ReactTooltip>
        </div>
    );
  }
}
