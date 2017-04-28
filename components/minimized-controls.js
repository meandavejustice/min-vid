const React = require('react');
const PrevTrackBtn = require('./prev-button');
const NextTrackBtn = require('./next-button');
const SoundControl = require('./sound-control');
const GeneralControls = require('./general-controls');
const PlaybackControl = require('./playback-control');
const Progress = require('./progress');

class MinimizedControls extends React.Component {
  render() {
    return (
        <div className='controls-wrapper'>
          <GeneralControls {...this.props} />

        <div className='bottom-controls controls minimized'>
            <Progress {...this.props} />
            <div className='left'>
              <PrevTrackBtn {...this.props} />
              <PlaybackControl {...this.props} />
              <NextTrackBtn {...this.props} />
            </div>
            <div className='right'>
              <SoundControl {...this.props} />
            </div>
          </div>
        </div>
    );
  }
}

module.exports = MinimizedControls;
