/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

const getVideoId = require('get-video-id');
const getYouTubeUrl = require('./lib/get-youtube-url.js');
const getVimeoUrl = require('./lib/get-vimeo-url.js');

const panel = require('sdk/panel').Panel({
  contentURL: './default.html',
  contentScriptFile: './controls.js',
  width: 320,
  height: 180,
  position: {
    bottom: 10,
    left: 10
  }
});

const { getActiveView } = require('sdk/view/core');
getActiveView(panel).setAttribute('noautohide', true);

panel.port.on('message', opts => {
  const title = opts.action;

  if (title === 'send-to-tab') {
    const pageUrl = getPageUrl(opts.domain, opts.id);
    if (pageUrl) {
      require('sdk/tabs').open(pageUrl);
    } else {
      console.error('could not parse page url for ', opts); // eslint-disable-line no-console
    }
    panel.hide();
  } else if (title === 'close') {
    panel.hide();
  } else if (title === 'minimize') {
    panel.hide();
    panel.show({
      height: 40,
      position: {
        bottom: 0,
        left: 10
      }
    });
  } else if (title === 'maximize') {
    panel.hide();
    panel.show({
      height: 180,
      position: {
        bottom: 10,
        left: 10
      }
    });
  }
});

function getPageUrl(domain, id) {
  let url;
  if (domain.indexOf('youtube') > -1) {
    url = 'https://youtube.com/watch?v=' + id;
  } else if (domain.indexOf('vimeo') > -1) {
    url = 'https://vimeo.com/' + id;
  }

  return url;
}

const cm = require('sdk/context-menu');

cm.Item({
  label: 'Send to mini player',
  context: cm.SelectorContext('[href*="youtube.com"], [href*="youtu.be"]'),
  contentScript: 'self.on("click", function (node, data) {' +
                 '  self.postMessage(node.href);' +
                 '});',
  onMessage: function(url) {
    const id = getVideoId(url);
    updatePanel({domain: 'youtube.com', id: id, src: ''});
    getYouTubeUrl(id, function(err, streamUrl) {
      if (!err) {
        updatePanel({src: streamUrl});
      }
    });
  }
});

cm.Item({
  label: 'Send to mini player',
  context: [
    cm.URLContext(['*.youtube.com']),
    cm.SelectorContext('[class*="yt-uix-sessionlink"]')
  ],
  contentScript: 'self.on("click", function (node, data) {' +
                 '  self.postMessage(node.href);' +
                 '});',
  onMessage: function(url) {
    const id = getVideoId(url);
    updatePanel({domain: 'youtube.com', id: id, src: ''});
    getYouTubeUrl(id, function(err, streamUrl) {
      if (!err) {
        updatePanel({src: streamUrl});
      }
    });
  }
});

cm.Item({
  label: 'Send to mini player',
  context: cm.SelectorContext('[href*="vimeo.com"]'),
  contentScript: 'self.on("click", function (node, data) {' +
                 '  self.postMessage(node.href);' +
                 '});',
  onMessage: function(url) {

    const id = getVideoId(url);
    updatePanel({domain: 'vimeo.com', id: id, src: ''});
    getVimeoUrl(id, function(err, streamUrl) {
      if (!err) {
        updatePanel({src: streamUrl});
      }
    });
  }
});

function updatePanel(opts) {
  panel.port.emit('set-video', opts);
  panel.show();
}

const pageMod = require('sdk/page-mod');

pageMod.PageMod({
  include: '*',
  contentScriptFile: './resize-listener.js',
  onAttach: function(worker) {
    worker.port.on('resized', function() {
      refreshPanel();
    });
  }
});

function refreshPanel() {
  if (panel.isShowing) {
    panel.hide();
    panel.show();
  }
}
