import React from 'react';
import cn from 'classnames';
import keyboardJS from 'keyboardjs';
import ReactPlayer from 'react-player';

import AudioCtrl from '../client-lib/audio-ctrl';
import formatTime from '../client-lib/format-time';
import sendToAddon from '../client-lib/send-to-addon';
import sendMetricsEvent from '../client-lib/send-metrics-event';

import Queues from './queues';
import ErrorView from './error-view';
import ReplayView from './replay-view';
import PrevTrackBtn from './prev-button';
import NextTrackBtn from './next-button';
import PlayerControls from './player-controls';
import GeneralControls from './general-controls';
import MinimizedControls from './minimized-controls';

export default class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false, progress: 0, exited: false,
      showQueue: false, historyIndex: 0,
      time: '0:00 / 0:00', errorCount: 0,
      notificationCount: 0, wasMinimized: false
    };

    if (this.props.queue[0].player === 'audio') this.loadAudio();
    else this.unLoadAudio();
  }

  componentDidMount() {
    this.attachKeyboardShortcuts();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.queue[0].url !== this.props.queue[0].url) {
      if (this.props.queue[0].player === 'audio') this.loadAudio();
      else this.unLoadAudio();
    }
  }

  componentWillUnmount() {
    this.unLoadAudio();
  }

  loadAudio() {
    clearTimeout(this.loadingTimeout);
    this.loadingTimeout = setTimeout(() => {
      console.error('ERROR: loading timeout'); // eslint-disable-line no-console
    }, 30000);

    if (this.audio) this.audio.remove();

    this.audio = new AudioCtrl(Object.assign({}, this.props, {
      muted: this.props.muted,
      playing: this.props.playing,
      url: this.props.queue[0].url,
      time: this.props.queue[0].currentTime,
      onError: () => {
        const q = window.AppData.queue.slice();
        q[0].error = true;
        window.AppData.set({loaded: true, queue: JSON.stringify(q)});
      },
      onEnded: this.onEnded.bind(this),
      onLoaded: this.onLoaded.bind(this),
      onProgress: this.onProgress.bind(this),
      container: this.audioContainer
    }));
  }

  unLoadAudio() {
    if (this.audio) {
      this.audio.remove();
      delete this.audio;
      delete this.audioContainer;
    }
  }

  enterPlayer() {
    this.setState({hovered: true});
  }

  leavePlayer() {
    this.setState({hovered: false});
  }

  onPlay() {
    sendMetricsEvent('player_view', 'play', this.props.queue[0].domain);
    window.AppData.set({playing: true});
  }

  onPause() {
    sendMetricsEvent('player_view', 'pause'), this.props.queue[0].domain;
    window.AppData.set({playing: false});
  }

  handleVideoClick(ev) {
    ev.persist();
    if (this.props.exited) return;
    if ((ev.target.tagName !== 'VIDEO') && (ev.target.tagName !== 'CANVAS')) return;

    if (this.props.playing) {
      this.onPause();
      if (this.audio) this.audio.pause();
    } else {
      this.onPlay();
      if (this.audio) this.audio.play();
    }
  }

  onError() {
    window.AppData.set({error: true});
  }

  onEnded() {
    if (this.props.queue.length === 1) {
      window.AppData.set({exited: true});
    } else {
      // Force a render before we get the update response from
      // 'track-ended' event. This is to prevent a bug where
      // duplicates in the playlist get into a paused state. Bug #766
      const queue = window.AppData.queue.concat();
      queue.unshift({
        cc: false,
        videoId: '',
        url: '',
        domain: 'youtube.com',
        currentTime: 0,
        error: false,
        title: '',
        duration: 0,
        preview: `https://img.youtube.com/vi/blah/0.jpg`,
        live: false
      });
      window.AppData.set({queue: JSON.stringify(queue)});
      sendToAddon({action: 'track-ended'});
    }
  }

  onLoaded(duration) {
    clearTimeout(this.loadingTimeout);
    window.AppData.set({loaded: true, exited: false});
    if (this.props.queue[0].live) this.setState({time: 'LIVE'});
    if (duration) {
      window.AppData.set({duration});
      this.onProgress({played: 0});
    }
  }

  onProgress(ev) {
    if (this.props.queue[0].live) this.setState({progress: ev.played});
    else {
      this.setState({
        progress: ev.played,
        time: `${formatTime(window.AppData.duration * ev.played)} / ${formatTime(window.AppData.duration)}`
      });
    }
  }

  setTime(ev, seconds) {
    let clickedValue;
    if (ev) {
      ev.stopPropagation();
      const x = ev.pageX - ev.target.offsetLeft;
      clickedValue = x * ev.target.max / ev.target.offsetWidth;
    } else clickedValue = seconds;

    const nextTime = window.AppData.duration * clickedValue;

    if (this.audio) this.audio.time = nextTime;
    window.AppData.set({currentTime: nextTime});
    if (this.player) this.player.seekTo(clickedValue);
  }

  nextTrack() {
    if (this.props.queue.length < 2) return;
    this.replay();
    if (this.audio) this.audio.pause();
    sendToAddon({
      action: 'track-expedited',
      index: 1,
      moveIndexZero: true
    });
  }

  openQueueMenu() {
    if (this.props.minimized) {
      sendToAddon({action: 'maximize'});
      window.AppData.set({minimized: false});
      this.setState({wasMinimized: true});
    } else {
      this.setState({wasMinimized: false});
    }
    this.setState({showQueue: true});
  }

  closeQueueMenu() {
    this.setState({showQueue: false});
    if (this.state.wasMinimized) {
      sendToAddon({action: 'minimize'});
      window.AppData.set({minimized: true});
    }
  }

  handleSpace() {
    if (this.props.exited) return this.replay();
    window.AppData.set({playing: !window.AppData.playing});
    if (this.audio) {
      if (this.audio.playing) this.audio.pause();
      else this.audio.play();
    }
  }

  replay() {
    sendMetricsEvent('replay_view', 'replay', this.props.queue[0].domain);
    window.AppData.set({
      exited: false,
      playing: true
    });

    if (this.audio) {
      this.audio.time = 0;
      this.audio.play();
    } else this.setTime(null, 0);
  }

  startErrorTimeout() {
    // We want to only show the errored view for 3 seconds before
    // moving on to another track, unless there aren't anymore tracks
    // in the queue.
    const countdown = (count) => {
      this.setState({errorCount: count});
      if (count > 0) {
        setTimeout(() => { countdown(count - 1); }, 1000);
      } else if (this.props.queue[0].error) this.nextTrack();
    };

    if (this.state.errorCount) return;
    countdown(3);
  }

  startNotificationTimeout() {
    const countdown = (count) => {
      this.setState({notificationCount: count});
      if (count > 0) {
        setTimeout(() => { countdown(count - 1); }, 1000);
      } else window.AppData.set({trackAdded: false});
    };

    if (this.state.notificationCount) return;
    countdown(6);
  }

  render() {
    function debouncedVideoClickHandler(ev) {
      ev.persist();
      const that = this;
      setTimeout(function() {
        that.handleVideoClick.bind(that)(ev);
      }, 100);
    }

    if (this.props.queue[0].error && this.props.queue.length > 1) this.startErrorTimeout();

    let visualEl;

    if (this.props.queue[0].error) {
      visualEl = <ErrorView {...this.props} countdown={this.state.errorCount} />;
    } else if (this.props.queue[0].player === 'audio') {
      visualEl = <div id='audio-container' ref={(c) => { this.audioContainer = c; }} onClick={debouncedVideoClickHandler.bind(this)}/>;
    } else {
      this.unLoadAudio();
      visualEl = <ReactPlayer {...this.props} url={this.props.queue[0].url} ref={(c) => { this.player = c; }}
                        onPlay={this.onPlay.bind(this)}
                        onPause={this.onPause.bind(this)}
                        onProgress={this.onProgress.bind(this)}
                        onReady={this.onLoaded.bind(this)}
                        onDuration={(d) => window.AppData.set({duration: d})}
                        config={{'youtube': {'playerVars': {'cc_load_policy': this.props.queue[0].cc, disablekb: 1}}}}
                        progressFrequency={100}
                        onError={this.onError.bind(this)}
                        onEnded={this.onEnded.bind(this)} />;
    }

    let notification = null;

    if (!this.state.showQueue && this.props.trackAdded) {
      notification = <div className="notification fade-in-out">{this.props.strings.itemAddedNotification}</div>;
    }

    if (notification) this.startNotificationTimeout();

    const queuePanel = this.state.showQueue ? (<Queues className={cn({hidden: !this.state.showQueue})}
                                               {...this.props} replay={this.replay.bind(this)} audio={this.audio}
                                               closeQueueMenu={this.closeQueueMenu.bind(this)}/>)
                                            : null;

    const exited = this.props.exited ? (<ReplayView {...this.props} nextTrack={this.nextTrack.bind(this)} exited={this.props.exited}
                                                    replay={this.replay.bind(this)} />) : null;
    const controls = !this.props.minimized ? (<div>
                                                <GeneralControls {...this.props} hovered={this.state.hovered}
                                                                 openQueueMenu={this.openQueueMenu.bind(this)} />
                                                <PlayerControls {...this.props} hovered={this.state.hovered}
                                                                progress={this.state.progress}
                                                                audio={this.audio} time={this.state.time}
                                                                setTime={this.setTime.bind(this)}
                                                                replay={this.replay.bind(this)}
                                                                closeQueueMenu={this.closeQueueMenu.bind(this)} />
                                              </div>) : (<MinimizedControls {...this.props} progress={this.state.progress}
                                                                            nextTrack={this.nextTrack.bind(this)}
                                                                            openQueueMenu={this.openQueueMenu.bind(this)}
                                                                            replay={this.replay.bind(this)}
                                                                            time={this.state.time} audio={this.audio}
                                                                            setTime={this.setTime.bind(this)}
                                                                            hovered={this.state.hovered} />);

    return (<div className='video-wrapper'
                 onMouseEnter={this.enterPlayer.bind(this)}
                 onMouseLeave={this.leavePlayer.bind(this)}
                 onClick={debouncedVideoClickHandler.bind(this)}>
              <PrevTrackBtn {...this.props} hovered={this.state.hovered} />
              <NextTrackBtn {...this.props} nextTrack={this.nextTrack.bind(this)} hovered={this.state.hovered} />
              {controls}
              {notification}
              {queuePanel}
              {exited}
              {visualEl}
            </div>);
  }

  attachKeyboardShortcuts() {
    // seek forward
    keyboardJS.bind('right', ev => {
      if (this.props.queue[0].domain === 'youtube.com') return;
      if (this.props.queue[0].live) return;
      if (this.player) this.player.seekTo(((window.AppData.duration * this.state.progress) + 5) / window.AppData.duration);
      if (this.audio) this.audio.time = this.audio.time + 5;
      window.AppData.set({currentTime: (window.AppData.duration * this.state.progress) + 5});
    });

    // seek backward
    keyboardJS.bind('left', ev => {
      if (this.props.queue[0].domain === 'youtube.com') return;
      if (this.props.queue[0].live) return;
      if (this.player) this.player.seekTo(((window.AppData.duration * this.state.progress) - 5) / window.AppData.duration);
      if (this.audio) this.audio.time = this.audio.time - 5;
      window.AppData.set({currentTime: (window.AppData.duration * this.state.progress) - 5});
    });

    // next track
    keyboardJS.bind('>', () => this.nextTrack());

    // play/pause toggle
    keyboardJS.bind('space', () => this.handleSpace());
  }
}
