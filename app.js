const React = require('react');
const ReactDOM = require('react-dom');

// uncomment for manual testing purposes
// const testSrc = 'https://r17---sn-ab5l6n7r.googlevideo.com/videoplayback?mv=m&mt=1468352728&ms=au&id=o-AE03DODlnfLGm9N8CcnmyLtuxZePWALwIV9O1-aQoA-H&expire=1468374597&mime=video%2Fmp4&ip=65.88.88.176&requiressl=yes&pl=23&mn=sn-ab5l6n7r&mm=31&source=youtube&lmt=1439378563427365&cnr=14&sparams=cnr%2Cdur%2Cid%2Cinitcwndbps%2Cip%2Cipbits%2Citag%2Clmt%2Cmime%2Cmm%2Cmn%2Cms%2Cmv%2Cnh%2Cpl%2Cratebypass%2Crequiressl%2Csource%2Cupn%2Cexpire&nh=IgpwcjA1LmxnYTA3KgkxMjcuMC4wLjE&sver=3&initcwndbps=1900000&signature=961892B3A4873E80CBE75F9FE5B872D2E2A8060C.7A76E7058BC532B524B2C24C06BE30C72BA527EA&dur=154.807&itag=22&fexp=9416126%2C9416891%2C9419452%2C9422596%2C9425078%2C9428398%2C9431012%2C9431452%2C9431677%2C9431838%2C9433096%2C9433380%2C9433946%2C9435036%2C9435526%2C9435876%2C9437066%2C9437553%2C9437742%2C9438280%2C9438361%2C9438661%2C9438662%2C9438734%2C9439652%2C9439965%2C9440047%2C9440302%2C9440376%2C9440542%2C9440850&key=yt6&upn=SA-YwegWsYw&ratebypass=yes&ipbits=0';
// const vtestSrc = 'https://08-lvl3-pdl.vimeocdn.com/01/3108/0/15540231/29736282.mp4?expires=1468015395&token=0623f1dfc4b0c96f737a2';

const defaultData = {
  id: '',
  src: '',
  domain: '',
  minimized: false,
  loaded: false,
  error: false,
  muted: false,
  currentTime: '0:00 / 0:00',
  duration: 0,
  progress: 0.001, // force progress element to start out empty
  playing: false,
  volume: '0.5'
};

window.AppData = new Proxy(defaultData, {
  set: function(obj, prop, value) {
    obj[prop] = value;
    renderApp();
    return true;
  }
});

// uncomment for manual testing purposes
// setTimeout(function() {
//   window.AppData = Object.assign(window.AppData, {
//     loaded: false,
//     error: false,
//     progress: 0.001,
//     playing: false,
//     volume: '0.5',
//     src: testSrc,
//     domain: 'youtube.com'
//   });
// }, 2000);

// setTimeout(function() {
//   window.AppData = Object.assign(window.AppData, {
//     loaded: false,
//     error: false,
//     progress: 0,
//     playing: false,
//     volume: '0.5',
//     src: vtestSrc,
//     domain: 'vimeo.com'
//   });
// }, 8000);

function formatTime(c, d) {
  // example:   0:35 / 2:33
  return ((c / 60).toFixed(2) + ' / ' + (d / 60).toFixed(2)).replace('.', ':');
}

const App = React.createClass({
  render: function() {
    return (
        <div className={'app'}>
        {/* Show Error View, ELSE Show Loading View ELSE no view */}
        {this.props.error ? <ErrorView {...this.props}/> :
          (!this.props.loaded) ? <LoadingView {...this.props}/> : null}

        <div className={this.props.loaded ? 'player-wrap' : 'player-wrap hidden'}>
          <PlayerView {...this.props} />
        </div>
      </div>
    );
  }
});

const ErrorView = React.createClass({
  render: function() {
    return (
      <div className={'error'}>
        <img src={'img/sadface.png'}
             alt={'sadface because of error'}
             width={164} height={164}></img>
      </div>
    );
  }
});

const LoadingView = React.createClass({
  getInitialState: function() {
    return {hovered: false};
  },
  enterView: function() {
    this.setState({hovered: true});
  },
  leaveView: function() {
    this.setState({hovered: false});
  },
  close: function() {
    sendToAddon({action: 'close'});
  },
  render: function() {
    return (
        <div className={'loading'} onMouseEnter={this.enterView} onMouseLeave={this.leaveView}>
          <a onClick={this.close} className={'close ' + this.state.hovered ? '': 'hidden'} />
          <img src={'img/loading-bars.svg'}
               alt={'loading animation'}
               width={64} height={64}></img>
          <p>Loading video from {this.props.domain}</p>
        </div>
    );
  }
});

function sendToAddon(obj) {
  window.dispatchEvent(new CustomEvent('message', {detail: obj}));
}

const PlayerView = React.createClass({
  getInitialState: function() {
    return {showVolume: false, hovered: false};
  },
  step: function() {
    window.AppData = Object.assign(window.AppData, {
      currentTime: formatTime(this.refs.video.currentTime, window.AppData.duration),
      progress: this.refs.video.currentTime / window.AppData.duration
    });

    if (this.refs.video.currentTime >= window.AppData.duration) {
      window.AppData.playing = false;
    }

    if (window.AppData.playing) {
      requestAnimationFrame(this.step);
    }
  },
  onLoaded: function() {
    window.AppData = Object.assign(window.AppData, {
      loaded: true,
      duration: this.refs.video.duration
    });

    requestAnimationFrame(this.step);
  },
  componentDidMount: function() {
    this.refs.video.addEventListener('canplay', this.onLoaded);
    this.refs.video.addEventListener('durationchange', this.onLoaded);
    // TODO: progress here will help us calculate load/buffering of video
    this.refs.video.addEventListener('progress', ev => {});
  },
  play: function() {
    this.refs.video.play();
    window.AppData.playing = true;
    requestAnimationFrame(this.step);
  },
  pause: function() {
    this.refs.video.pause();
    window.AppData.playing = false;
  },
  mute: function() {
    this.refs.video.muted = true;
    window.AppData = Object.assign(window.AppData, {
      muted: true,
      volume: 0
    });
  },
  unmute: function() {
    this.refs.video.muted = false;
    window.AppData = Object.assign(window.AppData, {
      muted: false,
      volume: this.refs.video.volume
    });
  },
  setVolume: function(ev) {
    const muted = (ev.target.value === 0);
    this.refs.video.volume = ev.target.value;

    window.AppData = Object.assign(window.AppData, {
      muted: muted,
      volume: ev.target.value
    });
  },
  minimize: function() {
    sendToAddon({action: 'minimize'});
    window.AppData.minimized = true;
  },
  maximize: function() {
    sendToAddon({action: 'maximize'});
    window.AppData.minimized = false;
  },
  sendToTab: function() {
    sendToAddon({
      action: 'send-to-tab',
      id: window.AppData.id,
      domain: window.AppData.domain
    });
  },
  close: function() {
    sendToAddon({action: 'close'});
  },
  enterControls: function() {
    this.setState({showVolume: true});
  },
  leaveControls: function() {
    this.setState({showVolume: false});
  },
  enterPlayer: function() {
    this.setState({hovered: true});
  },
  leavePlayer: function() {
    this.setState({hovered: false});
  },
  render: function() {
    return (
      <div onMouseEnter={this.enterPlayer} onMouseLeave={this.leavePlayer} className={'video-wrapper'}>
        <div className={'controls ' + (this.state.hovered ? '' : 'hidden ') + (this.props.minimized ? 'minimized' : '')}
             onMouseEnter={this.enterControls} onMouseLeave={this.leaveControls}>
          <div className={'left'}>
            <a onClick={this.play} className={this.props.playing ? 'play hidden' : 'play'} />
            <a onClick={this.pause} className={this.props.playing ? 'pause' : 'pause hidden'} />
            <a onClick={this.mute} className={!this.props.muted ? 'mute' : 'mute hidden'} />
            <a onClick={this.unmute} className={this.props.muted ? 'unmute' : 'unmute hidden'} />
            <input type={'range'} className={this.state.showVolume ? 'volume' : 'volume hidden'}
                   min={'0'} max={'1'} step={'.01'} value={this.props.volume} onChange={this.setVolume}/>
          </div>

          <div className={'right'}>
            <a onClick={this.sendToTab} className={'tab'} />
            <a onClick={this.minimize} className={!this.props.minimized ? 'minimize' : 'minimize hidden'} />
            <a onClick={this.maximize} className={this.props.minimized ? 'maximize' : 'maximize hidden'} />
            <a onClick={this.close} className={'close'} />
          </div>
        </div>

        <div className={'progress ' + ((this.state.hovered && !this.props.minimized) ? '' : 'hidden')}>
          <span className={'domain'}>{this.props.domain}</span>
          <div className={'time'}>{this.props.currentTime}</div>
          <progress className={'video-progress'} value={this.props.progress + ''} />
        </div>

        <video id={'video'} ref={'video'} src={this.props.src} autoplay={false} />
      </div>
    );
  }
});

function renderApp() {
  ReactDOM.render(React.createElement(App, window.AppData),
                  document.getElementById('container'));
}
renderApp();
