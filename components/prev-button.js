const React = require('react');
const cn = require('classnames');
const keyboardJS = require('keyboardjs');
const ReactTooltip = require('react-tooltip');
const sendToAddon = require('../client-lib/send-to-addon');

module.exports = class PrevButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {historyIndex: 0};
  }

  componentDidMount() {
    // previous track
    keyboardJS.bind('<', () => this.prevTrack());
  }

  prevTrack () {
    let index;
    // if clicked more than once within
    // 5 seconds increment the index so
    // the user can get to further back
    // in history. Resets when timeout wears out.
    if (this.searchingHistory) {
      if (this.props.history.length > this.state.historyIndex + 1) {
        this.setState({historyIndex: this.state.historyIndex + 1});
      }
      index = this.state.historyIndex;
    } else {
      index = 0;
      this.searchingHistory = true;
      setTimeout(() => {
        this.searchingHistory = false;
        this.setState({historyIndex: 0});
      }, 5000);
    }

    sendToAddon({
      action: 'track-added-from-history',
      index: index
    });
  }

  render() {
    return (
        <div className={cn('prev-wrapper', {hidden: (!this.props.hovered && !this.props.minimized) || this.props.confirm || !this.props.history.length})}>
          <a onClick={this.prevTrack.bind(this)}
             className='prev' data-tip data-for='prev' />
          <ReactTooltip id='prev' effect='solid' place='right'>{this.props.strings.ttPrev}</ReactTooltip>
        </div>
    );
  }
}
