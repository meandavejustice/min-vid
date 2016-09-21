/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

const pageMod = require('sdk/page-mod');
const getYouTubeUrl = require('./lib/get-youtube-url.js');
const getVimeoUrl = require('./lib/get-vimeo-url.js');
const launchVideo = require('./lib/launch-video');
const sendMetricsData = require('./lib/send-metrics-data.js');
const initContextMenuHandlers = require('./lib/context-menu-handlers.js');
const panelUtils = require('./lib/panel-utils.js');

// handle browser resizing
pageMod.PageMod({
  include: '*',
  contentScriptFile: './resize-listener.js?cachebust=' + Date.now(),
  onAttach: function(worker) {
    worker.port.on('resized', function() {
      const panel = panelUtils.getPanel();
      if (panel && panel.isShowing) panelUtils.redraw();
    });
  }
});

// add launch icon to video embeds
pageMod.PageMod({
  include: '*',
  contentStyleFile: './icon-overlay.css?cachebust=' + Date.now(),
  contentScriptFile: './icon-overlay.js?cachebust=' + Date.now(),
  onAttach: function(worker) {
    worker.port.on('launch', function(opts) {
      if (opts.domain.indexOf('youtube.com') > -1) {
        opts.getUrlFn = getYouTubeUrl;
        sendMetricsData({
          object: 'overlay_icon',
          method: 'launch',
          domain: opts.domain
        });
        launchVideo(opts);
      } else if (opts.domain.indexOf('vimeo.com')  > -1) {
        opts.getUrlFn = getVimeoUrl;
        sendMetricsData({
          object: 'overlay_icon',
          method: 'launch',
          domain: opts.domain
        });
        launchVideo(opts);
      }
    });
    worker.port.on('metrics', sendMetricsData);
  }
});

// add 'send-to-mini-player' option to context menu
initContextMenuHandlers();
