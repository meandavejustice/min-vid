import React from 'react';
import cn from 'classnames';
import ReactTooltip from 'react-tooltip';

export default class NextButton extends React.Component {
  render() {
    return (
        <div className={cn('next-wrapper', {hidden: (!this.props.hovered && !this.props.minimized) || (this.props.queue.length < 2) || this.props.confirm})}>
          <a onClick={this.props.nextTrack}
             className='next' data-tip data-for='next' />
          <ReactTooltip id='next' effect='solid' place='right'>{this.props.strings.ttNext}</ReactTooltip>
        </div>
    );
  }
}
