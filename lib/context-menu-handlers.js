const cm = require('sdk/context-menu');
const _ = require('sdk/l10n').get;
const self = require('sdk/self');

const launchVideo = require('./launch-video');
const sendMetricsData = require('./send-metrics-data');

const getVimeoUrl = require('./get-vimeo-url');
const getYouTubeUrl = require('./youtube-helpers').getVideo;
const getSoundcloudUrl = require('./get-soundcloud-url');
const getUrlFnMock = require('./get-url-mock');

const playNowLabel = _('play_now');
const addToQueueLabel = _('add_to_queue');

const URLS = {
  'vimeo': ['vimeo.com/'],
  'youtube': ['youtube.com/', 'youtu.be/']
}

const menus = [];

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

/* Content Scripts */

const contextMenuContentScript = `
self.on('click', function (node, data) {
  self.postMessage({
    action: data,
    url: node.href || node['data-feed-url']
  });
});`;

const contentScriptVimeoCase = `self.on('click', function (node, data) {
  self.postMessage({
    action: data,
    url: 'https://vimeo.com/' + node.href
  });
});`

const contextMenuMediaContentScript = `
self.on('click', function (node, data) {
  let host = '';
  try {
    host = new URL(node.href || node.src).host;
  }
  catch (err) {
    console.error('error parsing domain from ', url, err);
    return;
  }

  self.postMessage({
    url: node.href || node.src,
    launchUrl: window.location.href,
    domain: host,
    action: data
  });
});`;

const contextMenuSoundCloudContentScript = `
self.on('click', function (node, data) {
  // if the target element isn't the link we
  // are looking for, recurse until we find it.
  function findLinkNode(node) {
    if (node && node.href) {
      self.postMessage({
        url: node.href,
        domain: 'soundcloud.com',
        action: data
      });
    }
    else findLinkNode(node.parentNode);
  }
  findLinkNode(node);
});`;

/* get the context menu with options to play and add to queue */
function getMenu(opts) {
  menus.push(cm.Menu(Object.assign(opts, {
    label: 'Min Vid',
    items: [
      cm.Item({label: playNowLabel, data: 'play', image: self.data.url('img/Play-gray.svg')}),
      cm.Item({label: addToQueueLabel, data: 'add-to-queue', image: self.data.url('img/Add-gray.svg'),})
    ]
  })));
}

function init() {
  const onMessageVimeoHandler = (opts) => {
    launch({
      url: opts.url,
      domain: 'vimeo.com',
      getUrlFn: getVimeoUrl,
      action: opts.action
    });
  };

  const onMessageYouTubeHandler = (opts) => {
    launch({
      url: opts.url,
      domain: 'youtube.com',
      getUrlFn: getYouTubeUrl,
      action: opts.action
    });
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
  getMenu({
    context: cm.PredicateContext(audioPredicateContext),
    contentScript: contextMenuMediaContentScript,
    onMessage: launch
  });

  /*
   * <video> handling
   */
  getMenu({
    context: cm.PredicateContext(videoPredicateContext),
    contentScript: contextMenuMediaContentScript,
    onMessage: launch
  });

  /*
   * Soundcloud handling
   */

  /*
   * Track links
   */
  getMenu({
    context: cm.PredicateContext(soundcloudPredicateContext),
    contentScript: contextMenuSoundCloudContentScript,
    onMessage: launch
  });

  /*
   * YouTube handling
   */
  getMenu({
    context: cm.SelectorContext(getSelectors('youtube')),
    contentScript: contextMenuContentScript,
    onMessage: onMessageYouTubeHandler
  });

  // watch page playlist video link
  getMenu({
    context: [
      cm.URLContext(['*.youtube.com']),
      cm.SelectorContext('.spf-link.playlist-video')
    ],
    contentScript: contextMenuContentScript,
    onMessage: onMessageYouTubeHandler
  });

  // Playlist page video links
  getMenu({
    context: [
      cm.URLContext(['*.youtube.com']),
      cm.SelectorContext('.pl-video-title-link')
    ],
    contentScript: contextMenuContentScript,
    onMessage: onMessageYouTubeHandler
  });

  // Thumbnail
  getMenu({
    context: [
      cm.URLContext(['*.youtube.com']),
      cm.SelectorContext('.yt-lockup-thumbnail > .yt-uix.sessionlink')
    ],
    contentScript: contextMenuContentScript,
    onMessage: onMessageYouTubeHandler
  });

  // Home page thumbnails
  getMenu({
    context: [
      cm.URLContext(['*.youtube.com']),
      cm.SelectorContext('.yt-lockup-thumbnail')
    ],
    contentScript: `
    self.on('click', function (node, data) {
      node = node.querySelector('a');
      self.postMessage({
        action: data,
        url: node.href || node['data-feed-url']
      });
    });`,
    onMessage: onMessageYouTubeHandler
  });

  // Title Link
  getMenu({
    context: [
      cm.URLContext(['*.youtube.com']),
      cm.SelectorContext('.yt-lockup-content .yt-lockup-title .yt-uix-sessionlink')
    ],
    contentScript: contextMenuContentScript,
    onMessage: onMessageYouTubeHandler
  });

  // Related Title link
  getMenu({
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

  getMenu({
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('[class*="faux_player"]')
    ],
    contentScript: `self.on('click', function (node, data) {
      self.postMessage({
        action: data,
        url: 'https://vimeo.com/' + node.getAttribute('data-clip-id')
      });
    });`,
    onMessage: onMessageVimeoHandler
  });

  getMenu({
    context: cm.SelectorContext(getSelectors('vimeo')),
    contentScript: contextMenuContentScript,
    onMessage: onMessageVimeoHandler
  });

  getMenu({
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('.contextclip-header a')
    ],
    contentScript: contentScriptVimeoCase,
    onMessage: onMessageVimeoHandler
  });

  getMenu({
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('.iris_video-vital__overlay.iris_link-box')
    ],
    contentScript: contentScriptVimeoCase,
    onMessage: onMessageVimeoHandler
  });

  getMenu({
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('.contextclip-img-thumb')
    ],
    contentScript: contentScriptVimeoCase,
    onMessage: onMessageVimeoHandler
  });

  /*
   * google.com search results handling
   */
  getMenu({
    context: [
      cm.URLContext(['*.google.com']),
      cm.SelectorContext(getSelectors('*', true)),
    ],
    contentScript: contextMenuContentScript,
    onMessage: function(opts) {
      const regex = /url=(https?[^;]*)/.exec(opts.url)[1];
      const decoded = decodeURIComponent(regex).split('&usg')[0];
      let getUrlFn, domain;
      if (decoded.indexOf('youtube.com' || 'youtu.be') > -1) {
        getUrlFn = getYouTubeUrl;
        domain = 'youtube.com';
      } else if (decoded.indexOf('vimeo.com')  > -1) {
        getUrlFn = getVimeoUrl;
        domain = 'vimeo.com';
      } else if (domain && getUrlFn) {
        launch({
          url: decoded,
          domain: domain,
          getUrlFn: getUrlFn,
          action: opts.action
        });
      }
    }
  });
}

function launch(opts) {
  // getUrlFn cannot be in a self.postMessage call, so for
  // soundcloud we must put it here

  if (!opts.getUrlFn) {
    if (opts.domain === 'soundcloud.com') opts.getUrlFn = getSoundcloudUrl;
    else opts.getUrlFn = getUrlFnMock;
  }

  sendMetricsData({object: 'contextmenu', method: 'activate', domain: opts.domain});
  opts.method = opts.action;
  launchVideo(opts);
}

function destroy() {
  menus.forEach(m => m.destroy());
}

module.exports = {
  init: init,
  destroy: destroy
};
