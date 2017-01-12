const React = require('react');
const cn = require('classnames');
const PlayerView = require('./player-view');
const LoadingView = require('./loading-view');
const ErrorView = require('./error-view');

class AppView extends React.Component {
  render() {
    return (
        <div className='app'>
          {/* Show Error View, ELSE Show Loading View ELSE no view */}
          {this.props.error ? <ErrorView {...this.props}/> :
            (!this.props.loaded) ? <LoadingView {...this.props}/> : null}

          <div className={cn('player-wrap', {hidden: !this.props.loaded})}>
            <PlayerView {...this.props} />
          </div>
        </div>
    );
  }
}

AppView.propTypes = {
  loaded: React.PropTypes.bool
};

module.exports = AppView;
