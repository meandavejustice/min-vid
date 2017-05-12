import React from 'react';
import sendToAddon from '../client-lib/send-to-addon';
import sendMetricsEvent from '../client-lib/send-metrics-event';

export default class ConfirmView extends React.Component {
  cancel(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    sendMetricsEvent('confirm_view', 'cancel');
    sendToAddon({action: 'confirm', choice: 'cancel'});
  }

  confirmVideo(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    sendToAddon(Object.assign(this.props.confirmContent, {
      action: 'confirm',
      choice: 'video',
      playerMethod: this.props.confirmContent.action,
      moveIndexZero: Boolean(window.AppData.currentTime)
    }));
  }

  confirmPlaylist(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    sendToAddon(Object.assign(this.props.confirmContent, {
      action: 'confirm',
      choice: 'playlist',
      playerMethod: this.props.confirmContent.action,
      moveIndexZero: Boolean(window.AppData.currentTime)
    }));
  }

  render() {
    const preMsg = (this.props.confirmContent.action === 'play') ? this.props.strings.playConfirmMsg : this.props.strings.addConfirmMsg;

    return (
        <div className='confirm'>
        <p className='confirm-message'>{this.props.strings.confirmMsg}</p>
        <br/>
        <br/>
        <a className='btn' onClick={this.confirmVideo.bind(this)}>
        <span className='truncated'>{`${preMsg} ${this.props.confirmContent.videoTitle}`}</span></a>
        <p className='or'>--------</p>
        <a className='btn' onClick={this.confirmPlaylist.bind(this)}>
        <span className='truncated'>{`${preMsg} ${this.props.confirmContent.playlistTitle}`}</span></a>
        <a className="cancel" onClick={this.cancel.bind(this)}>Do nothing</a>
        </div>
    );
  }
}
