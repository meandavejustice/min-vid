import React from 'react';
import cn from 'classnames';
import Progress from './progress';
import SoundControl from './sound-control';
import PlaybackControl from './playback-control';

export default class PlayerControls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {exited: false};
  }

  render() {
    return (<div className={cn('player-controls', {
      hidden: this.props.confirm,
      minimized: this.props.minimized,
      hovered: this.props.hovered})}>
            <PlaybackControl {...this.props} />
            <Progress {...this.props} />
            <SoundControl {...this.props}/>
            </div>);
  }
}
