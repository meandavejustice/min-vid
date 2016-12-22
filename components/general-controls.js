const React = require('react');
const cn = require('classnames');
const ReactTooltip = require('react-tooltip');
const emitter = require('../client-lib/emitter');

class GeneralControls extends React.Component {
  close() {
    emitter.emit('close');
  }

  minimize() {
    emitter.emit('minimize');
  }

  maximize() {
    emitter.emit('maximize');
  }

  sendToTab() {
    emitter.emit('send-to-tab');
  }

  render() {
    return (
      <div className='right drag'>
        <a onClick={this.sendToTab.bind(this)} data-tip data-for='sendToTab' className='tab'/>
        <ReactTooltip id='sendToTab' effect='solid' place={!this.props.minimized ? 'bottom': 'left'}>
          {this.props.strings.ttSendToTab}
        </ReactTooltip>

        <a className={cn('minimize', {hidden: this.props.minimized})}
           onClick={this.minimize.bind(this)} data-tip data-for='minimize' />
        <ReactTooltip id='minimize' effect='solid' place='left'>{this.props.strings.ttMinimize}</ReactTooltip>

        <a className={cn('maximize', {hidden: !this.props.minimized})}
           onClick={this.maximize.bind(this)} data-tip data-for='maximize' />
        <ReactTooltip id='maximize' effect='solid' place='left'>{this.props.strings.ttMaximize}</ReactTooltip>

        <a className='close' onClick={this.close.bind(this)} data-tip data-for='close' />
        <ReactTooltip id='close' effect='solid' place='left'>{this.props.strings.ttClose}</ReactTooltip>
      </div>
    );
  }
}

GeneralControls.propTypes = {
  strings: React.PropTypes.object,
  minimized: React.PropTypes.bool
};

module.exports = GeneralControls;
