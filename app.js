const React = require('react');
const ReactDOM = require('react-dom');
const ReactTooltip = require('react-tooltip');
const cn = require('classnames');

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
    // TODO: if more than one non-UI component needs to detect state changes,
    // update this function to use proper pub-sub: subscribe to state changes,
    // call callbacks on matching state change (or find a nice library).
    // Inlining metrics code for now.
    if (prop in obj && obj[prop] !== value) {
      console.log(Date.now() + ': changing ' + prop + ' from ' + obj[prop] + ' to ' + value);
      recordEvent({
        state: prop,
        oldValue: prop in obj && obj[prop] || null,
        newValue: value || null
      });
    }
    obj[prop] = value;
    renderApp();
    return true;
  }
});

// recordEvent filters through state changes and sends interesting events to
// telemetry, along with the app's current state.
//
// o is an object with the keys state, oldValue, newValue.
function recordEvent(o) {
  // Always ignore 'progress' changes, because they fire a LOT.
  if (o.state === 'progress') {
    return;
  }

  // Rules for sending an event:
  // If the ID changes to a truthy value, then the user just selected a video.
  // If 'playing' changes, the user clicked play or pause.
  // If 'minimized' changes, the user clicked minimize btn.
  // If 'muted' changes, the user clicked the mute btn.
  //
  // We detect 'close' or 'send to tab' by manually calling recordEvent with
  // state: 'close', oldValue: false, newValue: true
  // state: 'send-to-tab', oldValue: false, newValue: true
  // TODO: will this make sense on the server / dashboard?
  //
  // Note: ignoring the volume and progress sliders, which change continuously.
  // We can later add custom events like we do for 'close' and 'send-to-tab'.
  const loggedEvents = ['playing', 'minimized', 'muted', 'close', 'send-to-tab'];
  if ((o.state === 'id' && !!o.newValue) || loggedEvents.indexOf(o.state) > -1) {
    // Just send all the things and figure out the details on the server.
    sendPing(o, window.AppData);
  }
}

function formatTime(seconds) {
  const now = new Date(seconds * 1000);
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000));
  return utc.toLocaleTimeString('en-US', {hour12: false})
    .replace(/^00:/, '') // Strip leading "00:" if hours is empty.
    .replace(/^0/, '');  // Strip leading "0" in minutes, if any.
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
          <ReactTooltip place='bottom' effect='solid' />

          <a className={cn('close', {hidden: this.state.hovered})}
             onClick={this.close} data-tip='Close' />

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
      currentTime: `${formatTime(this.refs.video.currentTime)} / ${formatTime(window.AppData.duration)}`,
      progress: this.refs.video.currentTime / window.AppData.duration
    });

    if (this.refs.video.currentTime >= window.AppData.duration) {
      window.AppData.playing = false;
    }

    if (window.AppData.playing) requestAnimationFrame(this.step);
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
      domain: window.AppData.domain,
      time: this.refs.video.currentTime
    });
  },
  setTime: function(ev) {
    const x = ev.pageX - ev.target.offsetLeft;
    const clickedValue = x * ev.target.max / ev.target.offsetWidth;

    this.refs.video.currentTime = this.refs.video.duration * clickedValue;
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
        <div className={'video-wrapper'} onMouseEnter={this.enterPlayer}
             onMouseLeave={this.leavePlayer}>
          <div className={cn('controls', {hidden: !this.state.hovered, minimized: this.props.minimized})}
               onMouseEnter={this.enterControls} onMouseLeave={this.leaveControls}>
            <div className='left'>
              <ReactTooltip place='bottom' effect='solid' />

              <a onClick={this.play} data-tip='Play'
                 className={cn('play', {hidden: this.props.playing})} />
              <a onClick={this.pause} data-tip='Pause'
                 className={cn('pause', {hidden: !this.props.playing})} />
              <a onClick={this.mute} data-tip='Mute'
                 className={cn('mute', {hidden: this.props.muted})} />
              <a onClick={this.unmute} data-tip='Unmute'
                 className={cn('unmute', {hidden: !this.props.muted})} />
              <input type='range' className={cn('volume', {hidden: !this.state.showVolume})}
                     min='0' max='1' step='.01' value={this.props.volume}
                     onChange={this.setVolume}/>
            </div>

            <div className='right'>
              <a onClick={this.sendToTab} data-tip='Send to tab' className='tab' />
              <a onClick={this.minimize} data-tip='Minimize'
                 className={cn('minimize', {hidden: this.props.minimized})} />
              <a onClick={this.maximize} data-tip='Maximize'
                 className={cn('maximize', {hidden: !this.props.minimized})} />
              <a onClick={this.close} data-tip='Close' className='close' />
            </div>
         </div>

          <div className={cn('progress', {hidden: !this.state.hovered || this.props.minimized})}>
            <span className={'domain'}>{this.props.domain}</span>
            <div className={'time'}>{this.props.currentTime}</div>
            <progress className={'video-progress'} onClick={this.setTime}
                      value={this.props.progress + ''}  />
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
