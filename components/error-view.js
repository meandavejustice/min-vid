const React = require('react');
const cn = require('classnames');
const ReactTooltip = require('react-tooltip');
const sendToAddon = require('../client-lib/send-to-addon');
const sendMetricsEvent = require('../client-lib/send-metrics-event');
const GeneralControls = require('./general-controls');

module.exports = React.createClass({
  getInitialState: function() {
    return {hovered: false};
  },
  enterView: function() {
    this.setState({hovered: true});
  },
  leaveView: function() {
    this.setState({hovered: false});
  },
  sendToTab: function(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    sendMetricsEvent('error_view', 'send_to_tab');

    sendToAddon({
      action: 'send-to-tab',
      id: this.props.id,
      domain: this.props.domain,
      time: 0
    });
  },
  render: function() {
    return (
        <div className={'error'} onMouseEnter={this.enterView} onMouseLeave={this.leaveView}>
          <ReactTooltip place='bottom' effect='solid' />
          <div className={cn('controls', {hidden: !this.state.hovered, minimized: this.props.minimized})}>
            <div className='left' />
            <GeneralControls {...this.props} />
          </div>
          <div className='error-message-container'>
            <p className='error-message'>{"Something's gone wrong with this video, Try again later."}
              <br/>
              <br/>
              <span className='error-link' onClick={this.sendToTab}>{"Open in new tab"}</span>
            </p>
          </div>
        </div>
    );
  }
});
