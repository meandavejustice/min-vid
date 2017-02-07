const React = require('react');
const cn = require('classnames');
const Progress = require('./progress');
const SoundControl = require('./sound-control');
const PlaybackControl = require('./playback-control');

class PlayerControls extends React.Component {
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

module.exports = PlayerControls;
