import React from 'react';
import { storiesOf, action, linkTo } from '@kadira/storybook';
import { host } from 'storybook-host';

import App from '../components/app-view';
import Player from '../components/player-view';
import '../data/panel.css';

window.pendingCommands = [];

const props = window.appData = {
  strings: {
    trackAddedNotification: 'Track Added to queue',
    errorMsg: 'l10n string',
    errorLink: 'l10n string',
    loadingMsg: 'l10n string',
    ttMute: 'l10n string',
    ttPlay: 'l10n string',
    ttPause: 'l10n string',
    ttClose: 'l10n string',
    ttUnmute: 'l10n string',
    ttMinimize: 'l10n string',
    ttMaximize: 'l10n string',
    ttSendToTab: 'l10n string',
    ttSwitchVis: 'l10n string',
    ttScLimit: 'l10n string',
    ttScConnection: 'l10n string',
    ttScTrack: 'l10n string',
    ttScStreamable: 'l10n string',
    ttScRestricted: 'l10n string',
    ttVimeoConnection: 'l10n string'
  },

  confirm: false,
  confirmContent: {
    action: 'play',
    playlistTitle: 'Rebeccas bar playlist boi whatever omg',
    videoTitle: 'The Coneheads - Hack, Hack, Hack (Ver. 2)'
  },
  id: '',
  domain: 'worldstarhiphop.com',
  minimized: false,
  loaded: false,
  error: false,
  muted: false,
  exited: false,
  time: '0:00 / 0:00',
  currentTime: 0,
  duration: 0,
  progress: 0.001, // force progress element to start out empty
  trackAdded: true,

  volume: 0.5,

  width: 400,
  height: 260,
  playing: false,
  player: 'video',
  url : 'http://hw-mobile.worldstarhiphop.com/u/vid/2016/08/ElnmGcoIEJit_mobile.mp4',

  id: '',
  src: '',
  url: '', // only used for <audio>, <video> tags, and soundcloud
  domain: '',
  minimized: false,
  loaded: false,
  error: false,
  muted: false,
  exited: false,
  time: '0:00 / 0:00',
  currentTime: 0,
  duration: 0,
  progress: 0.001, // force progress element to start out empty
  playing: false,
  volume: 0.5,
  strings: {},
  visual: 'time',
  queue: [{
    title: 'Sadist | Blood Song CS [full]',
    url: 'https://www.youtube.com/watch?v=p8--ADjO44Q',
    domain: 'youtube.com',
    preview: 'https://img.youtube.com/vi/p8--ADjO44Q/0.jpg',
    time: '0'
  },
          {
            title: 'Big Black - Songs About Fucking (1987) [Full Album]',
            url: 'https://www.youtube.com/watch?v=s0xCAZLE7c8',
            domain: 'youtube.com',
            preview: 'https://img.youtube.com/vi/s0xCAZLE7c8/0.jpg',
            time: '1138'
          },
          {
            title: 'Sadist | Blood Song CS [full]',
            url: 'https://www.youtube.com/watch?v=p8--ADjO44Q',
            domain: 'youtube.com',
            preview: 'https://img.youtube.com/vi/p8--ADjO44Q/0.jpg',
            time: '0'
          },
          {
            title: 'Big Black - Songs About Fucking (1987) [Full Album]',
            url: 'https://www.youtube.com/watch?v=s0xCAZLE7c8',
            domain: 'youtube.com',
            preview: 'https://img.youtube.com/vi/s0xCAZLE7c8/0.jpg',
            time: '1138'
          },
          {
            title: 'Sadist | Blood Song CS [full]',
            url: 'https://www.youtube.com/watch?v=p8--ADjO44Q',
            domain: 'youtube.com',
            preview: 'https://img.youtube.com/vi/p8--ADjO44Q/0.jpg',
            time: '0'
          },
          {
            title: 'Big Black - Songs About Fucking (1987) [Full Album]',
            url: 'https://www.youtube.com/watch?v=s0xCAZLE7c8',
            domain: 'youtube.com',
            preview: 'https://img.youtube.com/vi/s0xCAZLE7c8/0.jpg',
            time: '1138'
          },
          {
            title: 'Sadist | Blood Song CS [full]',
            url: 'https://www.youtube.com/watch?v=p8--ADjO44Q',
            domain: 'youtube.com',
            preview: 'https://img.youtube.com/vi/p8--ADjO44Q/0.jpg',
            time: '0'
          },
          {
            title: 'Big Black - Songs About Fucking (1987) [Full Album]',
            url: 'https://www.youtube.com/watch?v=s0xCAZLE7c8',
            domain: 'youtube.com',
            preview: 'https://img.youtube.com/vi/s0xCAZLE7c8/0.jpg',
            time: '1138'
          }],
  history: [{
    title: 'Big Black - Songs About Fucking (1987) [Full Album]',
    url: 'https://www.youtube.com/watch?v=s0xCAZLE7c8',
    domain: 'youtube.com',
    preview: 'https://img.youtube.com/vi/s0xCAZLE7c8/0.jpg',
    time: '1138'
  }],
  // url: 'https://www.youtube.com/watch?v=Q-EOvWIGKxU'
  // url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U'
  // url: 'http://davejustice.com/assets/themes/twitter/chains.mp3'
  // volume: 0,
  // muted: true
}

storiesOf('Min Vid panel', module)
  .addDecorator(host({
    width: props.width, height: 260, border: '1px solid #ccc'
  }))

  .add('App view loading', () => (
      <App {...props}/>
  ))

  .add('App view loaded', () => (
      <App {...Object.assign({}, props, {loaded: true})}/>
  ))

  .add('App view playing', () => (
      <App {...Object.assign({}, props, {loaded: true, playing: true})}/>
  ))

  .add('App view error', () => (
      <App {...Object.assign({}, props, {error: true})}/>
  ))

  .add('App view replay', () => (
      <App {...Object.assign({}, props, {error: false, exited: true, loaded: true
                                         // , queue: []
                                        })}/>
  ))

  .add('App view replay queued', () => (
      <App {...Object.assign({}, props, {error: false, exited: true, loaded: true,
                                         secondsLeft: 3})}/>
  ))

  .add('App view load audio', () => (
      <App {...Object.assign({}, props,
                             {url: 'http://davejustice.com/assets/themes/twitter/chains.mp3',
                              loaded: true,
                              player: 'audio',
                              playing: false})} />
  ))

  .add('Confirm View', () => (
      <App {...Object.assign({}, props,
                             {loaded: true,
                              confirm: true,
                              playing: false})} />
  ))

  .add('App view load audio playing', () => (
      <App {...Object.assign({}, props,
                             {url: 'http://davejustice.com/assets/themes/twitter/chains.mp3',
                              loaded: true,
                              player: 'audio',
                              playing: true})} />
  ))

  .add('App view queue', () => (
      <App {...Object.assign({}, props, {loaded: true,
                                         queueShowing: true})}/>
  ))

  .add('Exited view', () => (
      <App {...Object.assign({}, props, {loaded: true,
                                         exited: true
                                        })}/>
  ))

  .add('Minimized', () => (
      <App {...Object.assign({}, props, {loaded: true,
                                         minimized: true,
                                         height: 40
                                        })}/>
  ))
