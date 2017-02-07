const React = require('react');
const ReactTooltip = require('react-tooltip');
const sendMetricsEvent = require('../client-lib/send-metrics-event');
const sendToAddon = require('../client-lib/send-to-addon');

function getView() {
  if (window.AppData.error) return 'error_view';
  return window.AppData.loaded ? 'player_view' : 'loading_view';
}

module.exports = class Close extends React.Component {
  close() {
    sendMetricsEvent(getView(), 'close');
    sendToAddon({action: 'close'});
  }

  render() {
    return (
        <div>
        <a className='close' onClick={this.close.bind(this)} data-tip data-for='close' />
        <ReactTooltip id='close' effect='solid' place='left'>{this.props.strings.ttClose}</ReactTooltip>
        </div>
    );
  }
}
