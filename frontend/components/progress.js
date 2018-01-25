import React from 'react';
import cn from 'classnames';

export default class Progress extends React.Component {
  onProgressClicked(ev) {
    this.props.setTime(ev);
    if (this.props.exited) window.AppData.set({playing: true, exited: false});
  }

  render() {
    return (
        <div className={cn('progress', {peek: !this.props.hovered || this.props.minimized})}>
        <span className={cn('domain', {hidden: !this.props.hovered || this.props.minimized})}>{this.props.queue[0].domain}</span>
        <div className={cn('time', {pointer: this.props.player === 'audio', hidden: !this.props.hovered || this.props.minimized})}>
        {this.props.time}</div>
        <progress className='video-progress' onClick={this.onProgressClicked.bind(this)} value={this.props.progress + ''} />
        </div>
    );
  }
}
