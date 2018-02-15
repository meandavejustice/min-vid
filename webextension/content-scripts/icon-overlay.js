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
    ytNewRelatedContainers.filter((el) => {
      return !~el.querySelector('.yt-simple-endpoint').href.indexOf('list=');
    }).forEach(ytHomePageHandler);
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
    ytWatchContainers.forEach(ytChannelElementHandler);
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



function ytChannelElementHandler(el) {
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
      url: el.querySelector('.ytp-title-link').href,
      domain: 'youtube.com',
      time: videoEl.currentTime,
      action: getAction(ev),
      cc
    };
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
  // const addIconEl = document.createElement('div');

  containerEl.className = getContainerClass(props);
  playIconEl.className = 'minvid__overlay__icon';
  playIconEl.id = 'minvid__overlay__icon__play';
  playIconEl.title = browser.i18n.getMessage('play_now');
  // addIconEl.className = 'minvid__overlay__icon';
  // addIconEl.id = 'minvid__overlay__icon__add';
  // addIconEl.title = browser.i18n.getMessage('add_to_queue');
  containerEl.appendChild(playIconEl);
  // containerEl.appendChild(addIconEl);

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
  const css = `
.minvid__overlay__bottom_container {
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
  bottom: 0;
  width: 100%;
  z-index: 1000;
}

.minvid__overlay__container {
    align-items: center;
    background-color: rgba(0,0,0,0.8);
    opacity: 0;
    border-radius: 0 0 4px 4px;
    height: 100%;
    justify-content: center;
    left: 4%;
    max-height: 30px;
    max-width: 36px;
    padding: 2px 2px 4px;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 1000;
}

.minvid__overlay__container:hover,
.minvid__overlay__bottom_container:hover {
    background: rgba(0,0,0,0.9);
}

.minvid__overlay__icon {
    display: block;
    cursor: pointer;
    height: 100%;
    opacity: 0.7;
    width: 100%;
}

#minvid__overlay__icon__play {
  background: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iNzQiIHZpZXdCb3g9IjAgMCA5NiA3NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+TWluIFZpZCBEYXJrIENvcHk8L3RpdGxlPjxnIGZpbGw9IiNGRkYiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PHBhdGggZD0iTTAgOC4wMDdDMCAzLjU4NSAzLjU4OCAwIDggMGg4MGM0LjQxOSAwIDggMy41ODIgOCA4LjAwN3Y1Ny45ODZDOTYgNzAuNDE1IDkyLjQxMiA3NCA4OCA3NEg4Yy00LjQxOSAwLTgtMy41ODItOC04LjAwN1Y4LjAwN3pNNyAyNmE1IDUgMCAwIDEgNS4wMDYtNWg3MS45ODhBNSA1IDAgMCAxIDg5IDI2djM2YTUgNSAwIDAgMS01LjAwNiA1SDEyLjAwNkE1IDUgMCAwIDEgNyA2MlYyNnoiLz48cGF0aCBkPSJNMTIgMzcuOTk3QTMuOTkzIDMuOTkzIDAgMCAxIDE1Ljk5OCAzNGgyNy4wMDRBNCA0IDAgMCAxIDQ3IDM3Ljk5N3YyMC4wMDZBMy45OTMgMy45OTMgMCAwIDEgNDMuMDAyIDYySDE1Ljk5OEE0IDQgMCAwIDEgMTIgNTguMDAzVjM3Ljk5N3ptMTEuNSA0LjM3YzAtLjMwOS4yMjItLjQ1LjQ5OS0uMzE2bDEyLjc5NCA2LjIwN2MuMjc1LjEzNC4yNzcuMzUgMCAuNDg0TDIzLjk5OSA1NC45NWMtLjI3Ni4xMzMtLjQ5OS0uMDA4LS40OTktLjMxNlY0Mi4zNjd6Ii8+PC9nPjwvc3ZnPg==") no-repeat;
  background-position: center bottom;
  background-size: 32px auto;
}

.minvid__overlay__wrapper:hover .minvid__overlay__container,
.minvid__overlay__wrapper:hover .minvid__overlay__bottom_container {
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

.minvid__overlay__container.fullscreen {
  display: none;
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
