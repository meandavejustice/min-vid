import React from 'react';
import PrevTrackBtn from './prev-button';
import NextTrackBtn from './next-button';
import SoundControl from './sound-control';
import GeneralControls from './general-controls';
import PlaybackControl from './playback-control';
import Progress from './progress';

export default class MinimizedControls extends React.Component {
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
