import React from 'react';
import sendToAddon from '../client-lib/send-to-addon';
import sendMetricsEvent from '../client-lib/send-metrics-event';

export default class ErrorView extends React.Component {
  componentWillMount() {
    const domain = this.props.queue.length ? this.props.queue[0].domain : null;
    sendMetricsEvent('error_view', 'render', domain);
  }

  sendToTab(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    sendMetricsEvent('error_view', 'send_to_tab', this.props.queue[0].domain);
    sendToAddon({
      action: 'send-to-tab',
      id: this.props.queue[0].videoId,
      domain: this.props.queue[0].domain,
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
