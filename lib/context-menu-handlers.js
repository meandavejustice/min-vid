const cm = require('sdk/context-menu');
const _ = require('sdk/l10n').get;
const launchVideo = require('./launch-video');
const sendMetricsData = require('./send-metrics-data');

const getYouTubeUrl = require('./get-youtube-url');
const getVimeoUrl = require('./get-vimeo-url');
const getVineUrl = require('./get-vine-url');
const getSoundcloudUrl = require('./get-soundcloud-url');

const contextMenuLabel = _('content_menu_msg');
const contextMenuContentScript = `
self.on('click', function (node, data) {
  self.postMessage(node.href || node['data-feed-url']);
});`;

const contentScriptVimeoCase = `self.on('click', function (node, data) {
  self.postMessage('https://vimeo.com/' + node.href);
});`

const contextMenuMediaContentScript = `
self.on('click', function (node, data) {
  let host = '';
  try {
    host = new URL(node.href || node.src).host;
  }
  catch (err) {
    console.log('error parsing domain from ', url, err);
    return;
  }

  self.postMessage({
    src: node.href || node.src,
    url: window.location.href,
    domain: host
  });
});`;

const contextMenuSoundcloudContentScript = `
self.on('click', function (node, data) {
  // if the target element isn't the link we
  // are looking for, recurse until we find it.
  function findLinkNode(node) {
    if (node && node.href) {
      self.postMessage({
        url: node.href,
        domain: 'soundcloud.com'
      });
    }
    else findLinkNode(node.parentNode);
  }
  findLinkNode(node);
});`;

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
    launchVideo({
      url: url,
      domain: 'vimeo.com',
      getUrlFn: getVimeoUrl});
  };

  const onMessageYouTubeHandler = (url) => {
    sendMetricsData({object: 'contextmenu', method: 'activate', domain: 'youtube.com'});
    launchVideo({
      url: url,
      domain: 'youtube.com',
      getUrlFn: getYouTubeUrl});
  };

  const onMessageMediaHandler = (opts) => {
    sendMetricsData({object: 'contextmenu', method: 'activate', domain: opts.domain});
    if (opts.domain === 'soundcloud.com') opts.getUrlFn = getSoundcloudUrl;
    launchVideo(opts);
  };

  function audioPredicateContext(context) {
    return new RegExp('^(https?:)?//*.+(.mp3|.opus|.weba|.ogg|.wav|.flac)')
      .exec(context.srcURL || context.linkURL);
  }

  function videoPredicateContext(context) {
    return new RegExp('^(https?:)?//*.+(.mp4|.ogg|.3gp|.ogv|.spx|.oga|.mkv|.webm)')
      .exec(context.srcURL || context.linkURL);
  }

  function soundcloudPredicateContext(context) {
    return new RegExp(/https:\/\/soundcloud.com\/[a-zA-Z]*(.+)\/[a-zA-Z]*(.+)/)
      .exec(context.linkURL);
  }

  /*
   * <audio> handling
   */
  getItem({
    label: contextMenuLabel,
    context: cm.PredicateContext(audioPredicateContext),
    contentScript: contextMenuMediaContentScript,
    onMessage: onMessageMediaHandler
  });

  /*
   * <video> handling
   */
  getItem({
    label: contextMenuLabel,
    context: cm.PredicateContext(videoPredicateContext),
    contentScript: contextMenuMediaContentScript,
    onMessage: onMessageMediaHandler
  });

  /*
   * Soundcloud handling
   */

  /*
   * Track links
   */
  getItem({
    label: contextMenuLabel,
    context: cm.PredicateContext(soundcloudPredicateContext),
    contentScript: contextMenuSoundcloudContentScript,
    onMessage: onMessageMediaHandler
  });

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

  // Home page thumbnails
  getItem({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.youtube.com']),
      cm.SelectorContext('.yt-lockup-thumbnail')
    ],
    contentScript: `
    self.on('click', function (node, data) {
      node = node.querySelector('a');
      self.postMessage(node.href || node['data-feed-url']);
    });`,
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
      launchVideo({
        url: url,
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
      launchVideo({
        url: url,
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
        launchVideo({
          url: decoded,
          domain: domain,
          getUrlFn: getUrlFn});
      }
    }
  });
}
