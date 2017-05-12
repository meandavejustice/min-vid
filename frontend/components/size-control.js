import React from 'react';
import cn from 'classnames';
import keyboardJS from 'keyboardjs';
import ReactTooltip from 'react-tooltip';
import sendMetricsEvent from '../client-lib/send-metrics-event';
import sendToAddon from '../client-lib/send-to-addon';

function getView() {
  if (window.AppData.error) return 'error_view';
  return window.AppData.loaded ? 'player_view' : 'loading_view';
}

export default class SizeControl extends React.Component {
  componentDidMount() {
    // minimized/maximize toggle keyboard shortcut
    keyboardJS.bind('M', () => {
      if (window.AppData.minimized) this.maximize();
      else this.minimize();
    });
  }
  minimize() {
    const domain = this.props.queue.length ? this.props.queue[0].domain : null;
    sendMetricsEvent(getView(), 'minimize', domain);
    sendToAddon({action: 'minimize'});
    window.AppData.set({minimized: true});
  }

  maximize() {
    const domain = this.props.queue.length ? this.props.queue[0].domain : null;
    sendMetricsEvent(getView(), 'maximize', domain);
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
