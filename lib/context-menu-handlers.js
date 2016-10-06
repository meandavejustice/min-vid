const cm = require('sdk/context-menu');
const launchVideo = require('./launch-video');
const sendMetricsData = require('./send-metrics-data');

const getYouTubeUrl = require('./get-youtube-url');
const getVimeoUrl = require('./get-vimeo-url');
const getVineUrl = require('./get-vine-url');

const contextMenuLabel = 'Send to mini player';
const contextMenuContentScript = `
self.on('click', function (node, data) {
  self.postMessage(node.href || node['data-feed-url']);
});`;

const contentScriptVimeoCase = `self.on('click', function (node, data) {
  self.postMessage('https://vimeo.com/' + node.href);
});`

const URLS = {
  'vimeo': ['vimeo.com/'],
  'youtube': ['youtube.com/', 'youtu.be/'],
  'vine': ['vine.co/']
}

const items = [];

// Given a video service name from the URLS object, return an href *= selector
// for the corresponding urls.
// Arguments:
//   videoService: a key from URLS or '*' for all domains from URLS
//   shouldEncode: (optional) encode domains if true
function getSelectors(videoService, shouldEncode) {
  let domains = [];
  if (videoService in URLS) {
    domains = URLS[videoService]
  } else if (videoService === '*') {
    domains = Object.keys(URLS).map(name => URLS[name])
                    .reduce((prev, curr) => prev.concat(curr))
  } else {
    console.error(`Error: ${videoService} missing or not supported`) // eslint-disable-line no-console
  }
  const selectors = domains.map(url => `[href*="${shouldEncode ? encodeURIComponent(url) : url}"]`)
                           .reduce((prev, curr) => `${prev}, ${curr}`)

  return selectors;
}

module.exports = {
  init: init,
  destroy: destroy
};

function destroy() {
  items.forEach(i => i.destroy());
}

function getItem(opts) {
  items.push(cm.Item(opts));
}

function init() {
  const onMessageVimeoHandler = (url) => {
    sendMetricsData({object: 'contextmenu', method: 'activate', domain: 'vimeo.com'});
    launchVideo({url: url,
                 domain: 'vimeo.com',
                 getUrlFn: getVimeoUrl});
  };

  const onMessageYouTubeHandler = (url) => {
    sendMetricsData({object: 'contextmenu', method: 'activate', domain: 'youtube.com'});
    launchVideo({url: url,
                 domain: 'youtube.com',
                 getUrlFn: getYouTubeUrl});
  };

  /*
   * YouTube handling
   */
  getItem({
    label: contextMenuLabel,
    context: cm.SelectorContext(getSelectors('youtube')),
    contentScript: contextMenuContentScript,
    onMessage: onMessageYouTubeHandler
  });

  // Thumbnail
  getItem({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.youtube.com']),
      cm.SelectorContext('.yt-lockup-thumbnail > .yt-uix.sessionlink')
    ],
    contentScript: contextMenuContentScript,
    onMessage: onMessageYouTubeHandler
  });

  // Title Link
  getItem({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.youtube.com']),
      cm.SelectorContext('.yt-lockup-content .yt-lockup-title .yt-uix-sessionlink')
    ],
    contentScript: contextMenuContentScript,
    onMessage: onMessageYouTubeHandler
  });

  // Related Title link
  getItem({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.youtube.com']),
      cm.SelectorContext('.watch-sidebar-section .yt-uix-sessionlink')
    ],
    contentScript: contextMenuContentScript,
    onMessage: onMessageYouTubeHandler
  });

  /*
   * Vimeo handling
   */

  getItem({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('[class*="faux_player"]')
    ],
    contentScript: `self.on('click', function (node, data) {
      self.postMessage('https://vimeo.com/' + node.getAttribute('data-clip-id'));
    });`,
    onMessage: onMessageVimeoHandler
  });

  getItem({
    label: contextMenuLabel,
    context: cm.SelectorContext(getSelectors('vimeo')),
    contentScript: contextMenuContentScript,
    onMessage: onMessageVimeoHandler
  });

  getItem({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('.contextclip-header a')
    ],
    contentScript: contentScriptVimeoCase,
    onMessage: onMessageVimeoHandler
  });

  getItem({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('.iris_video-vital__overlay.iris_link-box')
    ],
    contentScript: contentScriptVimeoCase,
    onMessage: onMessageVimeoHandler
  });

  getItem({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('.contextclip-img-thumb')
    ],
    contentScript: contentScriptVimeoCase,
    onMessage: onMessageVimeoHandler
  });

  /*
   * Vine.co handling
   */
  getItem({
    label: contextMenuLabel,
    context: cm.SelectorContext(getSelectors('vine')),
    contentScript: contextMenuContentScript,
    onMessage: function(url) {
      sendMetricsData({object: 'contextmenu', method: 'activate', domain: 'vine.co'});
      launchVideo({url: url,
                   domain: 'vine.co',
                   getUrlFn: getVineUrl});
    }
  });

  getItem({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['https://vine.co/*']),
      cm.SelectorContext('video')
    ],
    contentScript: `self.on('click', function (node, data) {
      self.postMessage(node.poster);
    });`,
    onMessage: function(url) {
      const mp4 = url.replace(/thumbs/, 'videos').split(/\.jpg/)[0];
      sendMetricsData({object: 'contextmenu', method: 'activate', domain: 'vine.co'});
      launchVideo({url: url,
                   domain: 'vine.co',
                   src: mp4});
    }
  });

  /*
   * google.com search results handling
   */
  getItem({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.google.com']),
      cm.SelectorContext(getSelectors('*', true)),
    ],
    contentScript: contextMenuContentScript,
    onMessage: function(url) {
      const regex = /url=(https?[^;]*)/.exec(url)[1];
      const decoded = decodeURIComponent(regex).split('&usg')[0];
      let getUrlFn, domain;
      if (decoded.indexOf('youtube.com' || 'youtu.be') > -1) {
        getUrlFn = getYouTubeUrl;
        domain = 'youtube.com';
      } else if (decoded.indexOf('vimeo.com')  > -1) {
        getUrlFn = getVimeoUrl;
        domain = 'vimeo.com';
      } else if (decoded.indexOf('vine.co') > -1) {
        getUrlFn = getVineUrl;
        domain = 'vine.co';
      }
      if (domain && getUrlFn) {
        sendMetricsData({object: 'contextmenu', method: 'activate', domain: domain});
        launchVideo({url: decoded,
                     domain: domain,
                     getUrlFn: getUrlFn});
      }
    }
  });
}
