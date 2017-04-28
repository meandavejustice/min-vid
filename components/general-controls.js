const React = require('react');
const cn = require('classnames');
const ReactTooltip = require('react-tooltip');
const Close = require('./close-control');
const SendToTab = require('./send-to-tab')
const SizeControl = require('./size-control');

module.exports = class GeneralControls extends React.Component {
  render() {
    return (
        <div className={cn('controls drag', {hidden: !this.props.hovered && !this.props.minimized, minimized: this.props.minimized})}>
          <div className='left'>
            <Close {...this.props} />
          </div>

          <div className='right'>
            <SendToTab {...this.props} />
            <SizeControl {...this.props} />

            <div>
              <a className='open-queue'
                 onClick={this.props.openQueueMenu} data-tip data-for='open-queue-menu' />
              <ReactTooltip id='open-queue-menu' effect='solid' place='left'>{this.props.strings.ttOpenQueue}</ReactTooltip>
            </div>
          </div>
      </div>
    );
  }
}
