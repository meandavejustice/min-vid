const host = window.location.host;
let availableMetricSent = false;

browser.runtime.onMessage.addListener(onMessage);

injectStyle();
checkForEmbeds();
const overlayCheckInterval = setInterval(checkForEmbeds, 3000);

function onMessage(opts) {
  const title = opts.title;
  delete opts.title;
  if (title === 'detach') {
    // TODO removeStyle();
    clearInterval(overlayCheckInterval);
    Array.from(document.querySelectorAll('.minvid__overlay__wrapper'))
      .forEach(removeOverlay);
  }
}

function removeOverlay(el) {
  el.classList.remove('minvid__overlay__wrapper');
  const containerEl = el.querySelector('.minvid__overlay__container');
  if (containerEl) containerEl.remove();
}

function checkForEmbeds() {
  ytEmbedChecks();
  vimeoEmbedChecks();
  soundcloudEmbedChecks();
}

function ytEmbedChecks() {
  if (!(host.indexOf('youtube.com') > -1)) return;

  // New Youtube Home Page
  const ytNewHomeContainers = Array.from(document.querySelectorAll('#contents ytd-thumbnail'));
  if (ytNewHomeContainers.length) {
    sendMetric('available');
    ytNewHomeContainers.forEach(ytHomePageHandler);
  }

  // YouTube Home Page
  const ytHomeContainers = Array.from(document.querySelectorAll('#feed .yt-lockup-thumbnail'));
  if (ytHomeContainers.length) {
    sendMetric('available');
    ytHomeContainers.forEach(ytHomePageHandler);
  }

  const ytSearchContainers = Array.from(document.querySelectorAll('#results .yt-lockup-thumbnail'));
  if (ytSearchContainers.length) {
    ytSearchContainers.forEach(ytHomePageHandler);
  }

  // YouTube Watch Page
  const ytWatchContainer = document.querySelector('.html5-video-player');
  if (ytWatchContainer) {
    sendMetric('available');
    ytWatchElementHandler(ytWatchContainer);
  }

  // YouTube Watch Page related videos
  const ytRelatedContainers = Array.from(document.querySelectorAll('.watch-sidebar-section .thumb-wrapper'));
  if (ytRelatedContainers.length) {
    ytRelatedContainers.forEach(ytHomePageHandler);
  }

  // YouTube Channel Page videos featured section
  const ytChannelFeaturedContainers = Array.from(document.querySelectorAll('#browse-items-primary .lohp-thumb-wrap'));
  if (ytChannelFeaturedContainers.length) {
    sendMetric('available');
    ytChannelFeaturedContainers.forEach(ytHomePageHandler);
  }

  // YouTube Channel Page videos uploads section
  const ytChannelUploadsContainers = Array.from(document.querySelectorAll('#browse-items-primary .yt-lockup-thumbnail'));
  if (ytChannelUploadsContainers.length) {
    sendMetric('available');
    ytChannelUploadsContainers.forEach(ytHomePageHandler);
  }
}

function ytHomePageHandler(el) {
  if (el.classList.contains('minvid__overlay__wrapper')) return;

  const urlEl = el.querySelector('.yt-uix-sessionlink') || el.querySelector('.ytd-thumbnail');

  if (!urlEl || !urlEl.getAttribute('href')) return;

  const url = urlEl.getAttribute('href');

  if (!url.startsWith('/watch')) return;

  el.classList.add('minvid__overlay__wrapper');
  const tmp = getTemplate();
  tmp.addEventListener('click', function(ev) {
    evNoop(ev);
    browser.runtime.sendMessage({
      title: 'launch',
      url: 'https://youtube.com' + url,
      domain: 'youtube.com',
      action: getAction(ev)
    });
  });
  el.appendChild(tmp);
}

function ytWatchElementHandler(el) {
  if (el.classList.contains('minvid__overlay__wrapper')) return;

  el.classList.add('minvid__overlay__wrapper');
  const tmp = getTemplate();
  tmp.addEventListener('click', function(ev) {
    evNoop(ev);
    const videoEl = document.querySelector('video');
    const cc = !!(document.querySelector('.ytp-subtitles-button').getAttribute('aria-pressed') !== 'false');
    videoEl.pause();
    closeFullscreen();
    const options = {
      title: 'launch',
      url: window.location.href,
      domain: 'youtube.com',
      time: videoEl.currentTime,
      action: getAction(ev),
      cc
    };
    if (options.action !== 'add-to-queue') {
      options.volume = videoEl.volume;
      options.muted = videoEl.muted;
    }
    browser.runtime.sendMessage(options);
  });
  el.appendChild(tmp);
}

function soundcloudEmbedChecks() {
  if (!(host.indexOf('soundcloud.com') > -1)) return;

  // soundcloud.com/stream
  const soundcloudStreamCovers = Array.from(document.querySelectorAll('.sound__coverArt'));
  if (soundcloudStreamCovers.length) {
    soundcloudStreamCovers.forEach(el => {
      if (el.classList.contains('minvid__overlay__wrapper')) return;

      el.classList.add('minvid__overlay__wrapper');
      const tmp = getTemplate();
      tmp.addEventListener('click', function(ev) {
        evNoop(ev);
        browser.runtime.sendMessage({
          title: 'launch',
          url: 'https://soundcloud.com' + el.getAttribute('href'),
          domain: 'soundcloud.com',
          action: getAction(ev)
        });
      });
      el.appendChild(tmp);
    });
    sendMetric('available');
  }

  // souncloud.com/artist/track
  const soundcloudTrackCover = document.querySelector('.fullHero__artwork');
  if (soundcloudTrackCover) {
    if (soundcloudTrackCover.classList.contains('minvid__overlay__wrapper')) return;
    soundcloudTrackCover.classList.add('minvid__overlay__wrapper');
    const tmp = getTemplate();
    tmp.addEventListener('click', function(ev) {
      evNoop(ev);
      browser.runtime.sendMessage({
        title: 'launch',
        url: window.location.href,
        domain: 'soundcloud.com',
        action: getAction(ev)
      });
    }, true);
    soundcloudTrackCover.appendChild(tmp);
    sendMetric('available');
  }
}


function vimeoEmbedChecks() {
  if (!(host.indexOf('vimeo.com') > -1)) return;

  // VIMEO LOGGED-OUT HOME PAGE
  const vimeoDefaultHomeContainers = Array.from(document.querySelectorAll('.iris_video-vital__overlay'));
  if (vimeoDefaultHomeContainers.length) {
    vimeoDefaultHomeContainers.forEach(el => {
      if (el.classList.contains('minvid__overlay__wrapper')) return;

      el.classList.add('minvid__overlay__wrapper');
      const tmp = getTemplate();
      tmp.addEventListener('click', function(ev) {
        evNoop(ev);
        browser.runtime.sendMessage({
          title: 'launch',
          url: 'https://vimeo.com' + el.getAttribute('href'),
          domain: 'vimeo.com',
          action: getAction(ev)
        });
      });
      el.appendChild(tmp);
    });
    sendMetric('available');
  }

  // VIMEO LOGGED-IN HOME PAGE
  const vimeoHomeContainers = Array.from(document.querySelectorAll('.player_wrapper'));
  if (vimeoHomeContainers.length) {
    vimeoHomeContainers.forEach(el => {
      if (el.classList.contains('minvid__overlay__wrapper')) return;

      el.classList.add('minvid__overlay__wrapper');
      const tmp = getTemplate();
      tmp.addEventListener('click', function(ev) {
        evNoop(ev);
        const fauxEl = el.querySelector('.faux_player');
        if (fauxEl) {
          browser.runtime.sendMessage({
            title: 'launch',
            url: 'https://vimeo.com/' + fauxEl.getAttribute('data-clip-id'),
            domain: 'vimeo.com',
            action: getAction(ev)
          });
        } else console.error('Error: failed to locate vimeo url'); // eslint-disable-line no-console
      });
      el.appendChild(tmp);
    });
    sendMetric('available');
  }

  // VIMEO DETAIL PAGE
  const vimeoDetailContainer = document.querySelector('.player_container');
  if (vimeoDetailContainer) {
    if (vimeoDetailContainer.classList.contains('minvid__overlay__wrapper')) return;
    vimeoDetailContainer.classList.add('minvid__overlay__wrapper');
    const videoEl = vimeoDetailContainer.querySelector('video');
    const tmp = getTemplate();
    tmp.addEventListener('mouseup', evNoop);
    tmp.addEventListener('click', function(ev) {
      evNoop(ev);
      videoEl.pause();
      const options = {
        title: 'launch',
        url: window.location.href,
        domain: 'vimeo.com',
        action: getAction(ev)
      };

      if (options.action !== 'add-to-queue') {
        options.volume = videoEl.volume;
        options.muted = videoEl.muted;
      }
      browser.runtime.sendMessage(options);
    }, true);
    vimeoDetailContainer.appendChild(tmp);
    sendMetric('available');
  }
}

function getAction(ev) {
  return (ev.target.id === 'minvid__overlay__icon__play') ? 'play' : 'add-to-queue';
}

// General Helpers
function getTemplate() {
  const containerEl = document.createElement('div');
  const playIconEl = document.createElement('div');
  const addIconEl = document.createElement('div');

  containerEl.className = 'minvid__overlay__container';
  playIconEl.className = 'minvid__overlay__icon';
  playIconEl.id = 'minvid__overlay__icon__play';
  playIconEl.title = browser.i18n.getMessage('play_now');
  addIconEl.className = 'minvid__overlay__icon';
  addIconEl.id = 'minvid__overlay__icon__add';
  addIconEl.title = browser.i18n.getMessage('add_to_queue');
  containerEl.appendChild(playIconEl);
  containerEl.appendChild(addIconEl);

  return containerEl;
}

function sendMetric(method) {
  if (availableMetricSent) return;
  if (method === 'available') availableMetricSent = true;
  browser.runtime.sendMessage({
    title: 'metric',
    object: 'overlay_icon',
    method
  });
}

function evNoop(ev) {
  ev.preventDefault();
  ev.stopImmediatePropagation();
}

function closeFullscreen() {
  if (document.mozFullScreenEnabled) {
    document.mozCancelFullScreen();
  }
}

function injectStyle() {
  const css = `
.minvid__overlay__container {
    align-items: center;
    background-color: rgba(0,0,0,0.8);
    opacity: 0;
    border-radius: 0 0 4px 4px;
    height: 100%;
    justify-content: center;
    left: 4%;
    max-height: 80px;
    max-width: 36px;
    padding: 2px 2px 4px;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 999999;
}

.minvid__overlay__container:hover {
    background: rgba(0,0,0,0.9);
}

.minvid__overlay__icon {
    display: block;
    cursor: pointer;
    height: 40%;
    opacity: 0.7;
    width: 100%;
}

#minvid__overlay__icon__play {
  background: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iNzQiIHZpZXdCb3g9IjAgMCA5NiA3NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+TWluIFZpZCBEYXJrIENvcHk8L3RpdGxlPjxnIGZpbGw9IiNGRkYiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PHBhdGggZD0iTTAgOC4wMDdDMCAzLjU4NSAzLjU4OCAwIDggMGg4MGM0LjQxOSAwIDggMy41ODIgOCA4LjAwN3Y1Ny45ODZDOTYgNzAuNDE1IDkyLjQxMiA3NCA4OCA3NEg4Yy00LjQxOSAwLTgtMy41ODItOC04LjAwN1Y4LjAwN3pNNyAyNmE1IDUgMCAwIDEgNS4wMDYtNWg3MS45ODhBNSA1IDAgMCAxIDg5IDI2djM2YTUgNSAwIDAgMS01LjAwNiA1SDEyLjAwNkE1IDUgMCAwIDEgNyA2MlYyNnoiLz48cGF0aCBkPSJNMTIgMzcuOTk3QTMuOTkzIDMuOTkzIDAgMCAxIDE1Ljk5OCAzNGgyNy4wMDRBNCA0IDAgMCAxIDQ3IDM3Ljk5N3YyMC4wMDZBMy45OTMgMy45OTMgMCAwIDEgNDMuMDAyIDYySDE1Ljk5OEE0IDQgMCAwIDEgMTIgNTguMDAzVjM3Ljk5N3ptMTEuNSA0LjM3YzAtLjMwOS4yMjItLjQ1LjQ5OS0uMzE2bDEyLjc5NCA2LjIwN2MuMjc1LjEzNC4yNzcuMzUgMCAuNDg0TDIzLjk5OSA1NC45NWMtLjI3Ni4xMzMtLjQ5OS0uMDA4LS40OTktLjMxNlY0Mi4zNjd6Ii8+PC9nPjwvc3ZnPg==") no-repeat;
  background-position: center bottom;
  background-size: 32px auto;
}

#minvid__overlay__icon__add {
  background: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTRweCIgaGVpZ2h0PSIxNHB4IiB2aWV3Qm94PSIwIDAgMTQgMTQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+DQogICAgPGcgaWQ9IlN5bWJvbHMiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPg0KICAgICAgICA8cG9seWdvbiBpZD0iUGF0aCIgZmlsbD0iI0ZGRkZGRiIgcG9pbnRzPSI4LjQgNS42IDguNCAwIDUuNiAwIDUuNiA1LjYgMCA1LjYgMCA4LjQgNS42IDguNCA1LjYgMTQgOC40IDE0IDguNCA4LjQgMTQgOC40IDE0IDUuNiI+PC9wb2x5Z29uPg0KICAgIDwvZz4NCjwvc3ZnPg==") no-repeat;
  background-position: center bottom;
  background-size: 25px auto;
  margin-top: 5px;
}

.minvid__overlay__wrapper:hover .minvid__overlay__container {
    opacity: 1;
    /*background-color: rgba(0, 0, 0, .8);*/
    /*animation-name: fade;
    animation-duration: 4s;
    animation-iteration-count: initial;
    animation-fill-mode: forwards;*/
}

#minvid__overlay__icon__play:hover,
#minvid__overlay__icon__add:hover {
    opacity: 1;
}

@keyframes fade {
  0%   {opacity: 0}
  5%, 80% {opacity: 1}
  100% {opacity: 0}
}
  `;

  const head = document.head;
  const style = document.createElement('style');

  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}
