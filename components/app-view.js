const React = require('react');
const cn = require('classnames');
const PlayerView = require('./player-view');
const LoadingView = require('./loading-view');
const ConfirmView = require('./confirm-view');

class AppView extends React.Component {
  render() {
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

module.exports = AppView;
