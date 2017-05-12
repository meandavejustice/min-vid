import React from 'react';
import cn from 'classnames';
import PlayerView from './player-view';
import LoadingView from './loading-view';
import ConfirmView from './confirm-view';

export default class AppView extends React.Component {
  render() {
    // if (this.props.confirm) window.AppData.set({minimized: false});
    const confirmView = this.props.confirm ? (<ConfirmView {...this.props}/>) : null;
    const hideLoadingView = (this.props.queue.length && this.props.queue[0].error);

    return (
        <div className='app'>
          {confirmView}
          {(!this.props.loaded && !hideLoadingView) ? <LoadingView {...this.props} /> : null}

          <div className={cn('player-wrap', {hidden: !this.props.loaded && !hideLoadingView})}>
            {this.props.queue.length ? (<PlayerView {...this.props} />) : null}
          </div>
        </div>
    );
  }
}
