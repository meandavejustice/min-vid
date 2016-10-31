const React = require('react');
const cn = require('classnames');
const emitter = require('../client-lib/emitter');

module.exports = class ReplayView extends React.Component {
  replay() {
    emitter.emit('replay');
  }

  close() {
    emitter.emit('close');
  }

  render() {
    return (
        <div className={cn('exited', {hidden: !this.props.exited || this.props.minimized})}>
          <div className='row'>
            <button className='exit-replay' onClick={this.replay.bind(this)}></button>
            <button className='exit-close' onClick={this.close.bind(this)}></button>
          </div>
        </div>
    );
  }
}
