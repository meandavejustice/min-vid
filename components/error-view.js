const React = require('react');
const cn = require('classnames');
const sendToAddon = require('../client-lib/send-to-addon');
const sendMetricsEvent = require('../client-lib/send-metrics-event');
const GeneralControls = require('./general-controls');

module.exports = class ErrorView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hovered: false};
  }

  enterView() {
    this.setState({hovered: true});
  }

  leaveView() {
    this.setState({hovered: false});
  }

  sendToTab(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    sendMetricsEvent('error_view', 'send_to_tab');

    sendToAddon({
      action: 'send-to-tab',
      id: this.props.id,
      domain: this.props.domain,
      time: 0,
      tabId: this.props.tabId
    });
  }

  componentWillMount() {
    sendMetricsEvent('error_view', 'render');
  }

  render() {
    return (
        <div className='error' onMouseEnter={this.enterView.bind(this)} onMouseLeave={this.leaveView.bind(this)}>
          <div className={cn('controls drag', {hidden: !this.state.hovered, minimized: this.props.minimized})}>
            <div className='left' />
            <GeneralControls {...this.props} />
          </div>
          <div className='error-message-container'>
            <p className='error-message'>
              {this.props.strings.errorMsg}
              <br/>
              <br/>
            <span className='error-link' onClick={this.sendToTab.bind(this)}>{this.props.strings.errorLink}</span>
            </p>
          </div>
        </div>
    );
  }
}
