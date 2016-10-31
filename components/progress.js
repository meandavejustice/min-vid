const React = require('react');
const ReactTooltip = require('react-tooltip');
const cn = require('classnames');
const emitter = require('../client-lib/emitter');

module.exports = class ProgressView extends React.Component {
  setTime(ev) {
    ev.stopPropagation();
    const x = ev.pageX - ev.target.offsetLeft;
    const clickedValue = x * ev.target.max / ev.target.offsetWidth;
    // app-data needs to be required here instead of the top of the
    // module in order to avoid a circular dependency
    const nextTime = require('../client-lib/app-data').duration * clickedValue;

    emitter.emit('set-time', {value: nextTime});
  }

  timeClicked() {
    emitter.emit('update-visual');
  }

  render() {
    return (
        <div className={cn('progress', {hidden: this.props.minimized, peek: !this.props.hovered})}>
          <span className={cn('domain', {hidden: !this.props.hovered})}>{this.props.domain}</span>
          <div className={cn('time', {pointer: this.props.player === 'audio',
                                      hidden: !this.props.hovered})}
               onClick={this.timeClicked.bind(this)} data-tip
               data-for='switch-vis'>{this.props.time}</div>
          <ReactTooltip id='switch-vis' effect='solid' place='right'>{this.props.strings.ttSwitchVis}</ReactTooltip>
          <progress className='video-progress' onClick={this.setTime.bind(this)}
                    value={this.props.progress + ''}  />
        </div>
    );
  }
}
