const React = require('react');
const cn = require('classnames');

module.exports = class Progress extends React.Component {
  render() {
    return (
        <div className={cn('progress', {peek: !this.props.hovered || this.props.minimized})}>
        <span className={cn('domain', {hidden: !this.props.hovered || this.props.minimized})}>{this.props.queue[0].domain}</span>
        <div className={cn('time', {pointer: this.props.player === 'audio', hidden: !this.props.hovered || this.props.minimized})}>
        {this.props.time}</div>
        <progress className='video-progress' onClick={this.props.setTime.bind(this)} value={this.props.progress + ''} />
        </div>
    );
  }
}
