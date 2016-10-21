const React = require('react');
const cn = require('classnames');
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
  render: function() {
    return (
        <div className='loading' onMouseEnter={this.enterView} onMouseLeave={this.leaveView}>
          <div className={cn('controls', {hidden: !this.state.hovered, minimized: this.props.minimized})}>
            <div className='left' />
            <GeneralControls {...this.props} />
          </div>

          <img src='img/loading-bars.svg' alt='loading animation' width={64} height={64} />
          <p>{this.props.strings.loadingMsg}</p>
        </div>
    );
  }
});
