const React = require('react');
const sendToAddon = require('../client-lib/send-to-addon');
const sendMetricsEvent = require('../client-lib/send-metrics-event');

class ErrorView extends React.Component {
  componentWillMount() {
    sendMetricsEvent('error_view', 'render');
  }

  sendToTab(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    sendMetricsEvent('error_view', 'send_to_tab');
    sendToAddon({
      action: 'send-to-tab',
      id: this.props.queue[0].videoId,
      domain: this.props.queue[0].domain ,
      time: 0,
      tabId: this.props.tabId,
      url: this.props.queue[0].url,
      launchUrl: this.props.queue[0].launchUrl
    });
  }

  render() {
    const errorMsg = this.props.strings[this.props.error] ?
          this.props.strings[this.props.error] : this.props.strings.errorMsg;

    const countdownMsg = (this.props.countdown > 0 && this.props.queue.length > 1) ?
          (`Playing ${this.props.queue[1].title} in ${this.props.countdown} seconds`) : '';

    return (
        <div className='error'>
          <div className='error-message-container'>
            <div className='error-message'>
               <p>{errorMsg}</p>
               <p>{countdownMsg}</p>
              <span className='error-link'
                    onClick={this.sendToTab.bind(this)}>{this.props.strings.errorLink}</span>
            </div>
          </div>
        </div>
    );
  }
}

module.exports = ErrorView;
