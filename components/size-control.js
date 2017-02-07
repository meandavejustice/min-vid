const React = require('react');
const cn = require('classnames');
const keyboardJS = require('keyboardjs');
const ReactTooltip = require('react-tooltip');
const sendMetricsEvent = require('../client-lib/send-metrics-event');
const sendToAddon = require('../client-lib/send-to-addon');

function getView() {
  if (window.AppData.error) return 'error_view';
  return window.AppData.loaded ? 'player_view' : 'loading_view';
}

module.exports = class SizeControl extends React.Component {
  componentDidMount() {
    if (!this.props.keyShortcutsEnabled) return;
    // minimized/maximize toggle keyboard shortcut
    keyboardJS.bind('M', ev => {
      if (window.AppData.minimized) this.maximize();
      else this.minimize();
    });
  }
  minimize() {
    sendMetricsEvent(getView(), 'minimize');
    sendToAddon({action: 'minimize'});
    window.AppData.set({minimized: true});
  }

  maximize() {
    sendMetricsEvent(getView(), 'maximize');
    sendToAddon({action: 'maximize'});
    window.AppData.set({minimized: false});
  }

  render() {
    return (
        <div>
        <a className={cn('minimize', {hidden: this.props.minimized})}
      onClick={this.minimize.bind(this)} data-tip data-for='minimize' />
        <ReactTooltip id='minimize' effect='solid' place='left'>{this.props.strings.ttMinimize}</ReactTooltip>

        <a className={cn('maximize', {hidden: !this.props.minimized})}
      onClick={this.maximize.bind(this)} data-tip data-for='maximize' />
        <ReactTooltip id='maximize' effect='solid' place='left'>{this.props.strings.ttMaximize}</ReactTooltip>
        </div>
    );
  }
}
