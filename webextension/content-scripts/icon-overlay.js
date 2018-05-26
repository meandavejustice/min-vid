const host = window.location.host;
let availableMetricSent = false;

browser.runtime.onMessage.addListener(onMessage);

checkForEmbeds();
const overlayCheckInterval = setInterval(checkForEmbeds, 3000);

function onFullscreenChange() {
  const el = document.querySelector('.minvid__overlay__container');

  if (document.mozFullScreen) el.classList.add('fullscreen');
  else el.classList.remove('fullscreen');
}

document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('mozfullscreenchange', onFullscreenChange);

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
  newYtEmbedChecks();
  vimeoEmbedChecks();
  soundcloudEmbedChecks();
}

// New Youtube Page
function newYtEmbedChecks() {
  // Youtube Home Page
  const ytNewHomeContainers = Array.from(document.querySelectorAll('#contents ytd-thumbnail'));
  if (ytNewHomeContainers.length) {
    sendMetric('available');
    ytNewHomeContainers.forEach(ytHomePageHandler);
  }

  // Youtube Page related videos
  const ytNewRelatedContainers = Array.from(document.querySelectorAll('#items ytd-thumbnail'));
  if (ytNewRelatedContainers.length) {
    sendMetric('available');
    ytNewRelatedContainers.forEach(ytHomePageHandler);
  }

  // Youtube playlists
  const ytNewPlaylistContainers = Array.from(document.querySelectorAll('ytd-playlist-thumbnail'));
  if (ytNewPlaylistContainers.length) {
    sendMetric('available');
    ytNewPlaylistContainers.forEach(ytHomePageHandler);
  }
}

function ytEmbedChecks() {
  if (!(host.indexOf('youtube.com') > -1)) return;

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

  // YouTube Watch Page and main featured videos on channel page
  const ytWatchContainers = document.querySelectorAll('.html5-video-player');
  if (ytWatchContainers) {
    sendMetric('available');
    ytWatchContainers.forEach(ytWatchElementHandler);
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

  // Youtube Gaming Home Page
  const ytGamingContainers = Array.from(document.querySelectorAll('#contents .game-cell-contents'));
  if (ytGamingContainers.length) {
    sendMetric('available');
    ytGamingContainers.forEach(function ytGamingWrapper(el) {
      ytGamingHandler(el, { type: 'ytGamingHomePage' });
    });
  }

  // Youtube Gaming Home Page Carousel
  const ytGamingCarouselContainers = Array.from(document.querySelectorAll('#container.ytg-video-carousel .video-cell'));
  if (ytGamingCarouselContainers.length) {
    sendMetric('available');
    ytGamingCarouselContainers.forEach(function ytGamingCarouselWrapper(el) {
      ytGamingHandler(el, { type: 'ytGamingCarousel' });
    });
  }
}

function registerClick({ el, url }) {
  return function(ev) {
    evNoop(ev);
    browser.runtime.sendMessage({
      title: 'launch',
      url: 'https://youtube.com' + url,
      domain: 'youtube.com',
      action: getAction(ev)
    });
  };
}

function updateClickIfNeeded(el, { url, props }) {
  const targetClassName = `minvid__url__${url.replace('?', '')}`;

  // Element has the correct `URL`.
  if (el.classList.contains(targetClassName)) {
    return;
  }

  // Updates the `minvid__url__` className with new `url`
  const regExp = new RegExp('minvid__url__', 'g');
  const updatedClassName = el.className.split(' ').map(className => {
    if (!className.match(regExp)) {
      return className;
    }

    return targetClassName;
  }).join(' ');
  el.className = updatedClassName;

  // Reassign `eventListener` with new URL
  const tmp = getTemplate();
  tmp.addEventListener('click', registerClick({ el, url }));
  el.appendChild(tmp);
}

function ytHomePageHandler(el) {
  const urlEl = el.querySelector('.yt-uix-sessionlink')
    || el.querySelector('.ytd-playlist-thumbnail')
    || el.querySelector('.ytd-thumbnail');

  if (!urlEl || !urlEl.getAttribute('href')) return;

  const url = urlEl.getAttribute('href');

  if (!url.startsWith('/watch')) return;

  if (el.classList.contains('minvid__overlay__wrapper')) {
    updateClickIfNeeded(el, { url });
    return;
  }

  el.classList.add('minvid__overlay__wrapper');
  el.classList.add(`minvid__url__${url.replace('?', '')}`);
  const tmp = getTemplate();
  tmp.addEventListener('click', registerClick({ el, url }));
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

function ytGamingHandler(el, props) {
  if (el.classList.contains('minvid__overlay__wrapper')) return;

  if (el.contains(el.querySelector('.minvid__overlay__bottom_container'))) {
    el.classList.add('minvid__overlay__wrapper');
    return;
  }

  const urlEl = el.querySelector('.ytg-nav-endpoint');

  if (!urlEl || !urlEl.getAttribute('href')) return;

  const url = urlEl.getAttribute('href');

  if (!url.startsWith('/watch')) return;

  if (props.type === 'ytGamingHomePage') {
    // Fixes for Youtube Gaming
    el.style.position = 'relative';
  }

  el.classList.add('minvid__overlay__wrapper');
  const tmp = getTemplate(props);
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

function getContainerClass(props) {
  switch (props.type) {
  case 'ytGamingCarousel': return 'minvid__overlay__bottom_container';
  default: return 'minvid__overlay__container';
  }
}

// General Helpers
function getTemplate(props) {
  props = props || {};
  const containerEl = document.createElement('div');
  const playIconEl = document.createElement('div');
  const addIconEl = document.createElement('div');

  containerEl.className = getContainerClass(props);
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
  // only inject style if there are valid embeds on the page.
  injectStyle();
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
  browser.runtime.sendMessage({
    title: 'inject-style'
  });
}
