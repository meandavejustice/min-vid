import React from 'react';
import cn from 'classnames';
import Close from './close-control';
import SendToTab from './send-to-tab';
import SizeControl from './size-control';

export default class GeneralControls extends React.Component {
  render() {
    return (
        <div className={cn('controls drag', {hidden: !this.props.hovered && !this.props.minimized, minimized: this.props.minimized})}>
          <div className='left'>
            <Close {...this.props} />
          </div>

          <div className='right'>
            <SendToTab {...this.props} />
            <SizeControl {...this.props} />
          </div>
      </div>
    );
  }
}
