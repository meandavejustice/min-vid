const React = require('react');
const cn = require('classnames');
const Close = require('./close-control');
const SendToTab = require('./send-to-tab');
const SizeControl = require('./size-control');
const SoundControl = require('./sound-control');
const PlaybackControl = require('./playback-control');
const Progress = require('./progress');

class MinimizedControls extends React.Component {
  render() {
    return (
        <div className={cn('controls drag', {minimized: this.props.minimized})}>
        <Progress {...this.props} />
          <div className='left'>
            <PlaybackControl {...this.props} />
            <SoundControl {...this.props} />
          </div>
          <div className='right'>
            <Close {...this.props} />
            <SendToTab {...this.props} />
            <SizeControl {...this.props} />
          </div>
        </div>
    );
  }
}

module.exports = MinimizedControls;
