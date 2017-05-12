import React from 'react';
import cn from 'classnames';
import Sortable from 'sortablejs';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ReactTooltip from 'react-tooltip';
import sendToAddon from '../client-lib/send-to-addon';
import sendMetricsEvent from '../client-lib/send-metrics-event';
import Item from './queue-item';

Tabs.setUseDefaultStyles(false);

export default class QueuesView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabIndex: 0,
      keyPrefix: Math.random()
    };
  }

  handleSelect(index, last) {
    this.setState({activeTabIndex: index});
  }

  sortableContainersDecorator(componentBackingInstance) {
    const onEnd = (ev) => {
      sendToAddon({
        action: 'track-reordered',
        oldIndex: ev.oldIndex,
        newIndex: ev.newIndex
      });

      // Force react to update child components after drag completion
      // issue: https://github.com/RubaXa/Sortable/issues/908
      this.setState({keyPrefix: Math.random()});
    };

    if (componentBackingInstance) {
      Sortable.create(componentBackingInstance, {
        handle: '.drag-handle',
        onEnd
      });
    }
  }

  clearQueue() {
    sendMetricsEvent('queue_view', 'clear:queue');
    sendToAddon({action: 'clear', choice: 'queue'});
  }

  clearHistory() {
    sendMetricsEvent('queue_view', 'clear:history');
    sendToAddon({action: 'clear', choice: 'history'});
  }

  render() {
    return (
        <Tabs onSelect={this.handleSelect.bind(this)} selectedIndex={this.state.activeTabIndex}
              className='queues'>
          <header>
            <TabList className='queue-headers'>
              <Tab className={cn({active: (this.state.activeTabIndex === 0)})}><h3>{this.props.strings.playQueue}</h3></Tab>
              <Tab className={cn({active: (this.state.activeTabIndex === 1)})}><h3>{this.props.strings.history}</h3></Tab>
            </TabList>
            <a className='collapse-queue' onClick={this.props.closeQueueMenu.bind(this)} data-tip data-for='collapse-queue-menu'></a>
            <ReactTooltip id='collapse-queue-menu' effect='solid' place='left'>{this.props.strings.ttCloseQueue}</ReactTooltip>
          </header>

          <TabPanel className='panel-wrapper panel-queue'>
            <div className='clear'><a onClick={this.clearQueue.bind(this)}>{this.props.strings.clear}</a></div>
            <ul ref={this.sortableContainersDecorator.bind(this)}>
            {this.props.queue.map((item, i) => <Item {...item} shouldDrag={true} index={i} audio={this.props.audio}
                                  replay={this.props.replay} key={this.state.keyPrefix + i} />)}
            </ul>
          </TabPanel>

          <TabPanel className='panel-wrapper panel-history'>
          <div className='clear'><a onClick={this.clearHistory.bind(this)}>{this.props.strings.clear}</a></div>
            <ul ref={this.sortableContainersDecorator}>
            {this.props.history.map((item, i) => <Item {...item} key={this.state.keyPrefix + i} index={i} replay={this.props.replay} isHistory={true} />)}
            </ul>
          </TabPanel>
        </Tabs>
    );
  }
}
