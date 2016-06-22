/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

const qs = require('sdk/querystring');
var panel = require('sdk/panel').Panel({
  contentURL: './default.html',
  contentScriptFile: './controls.js',
  width: 320,
  height: 180,
  position: {
    bottom: 10,
    left: 10
  }
});

var { getActiveView } = require('sdk/view/core');
getActiveView(panel).setAttribute('noautohide', true);
getActiveView(panel).setAttribute('backdrag', true);

panel.port.on('link', opts => {
  var title = opts.title;
  var ytTab = 'https://youtube.com/watch?v=' + parseYoutubeId(opts.src) + '&t=' + opts.time;
  var vineTab = getVinePageURL(opts.src);

  if (title === 'send-to-tab') {
    if (isYoutube(opts.src)) {
      require('sdk/tabs').open(ytTab);
    } else if (isVine(opts.src)) {
      require('sdk/tabs').open(vineTab);
    }
    updatePanel('');
    panel.hide();
  } else if (title === 'close') {
    updatePanel('');
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

function isYoutube(url) {
  return (url.indexOf('youtube') > -1);
}

function isVine(url) {
  return (url.indexOf('vine') > -1); 
}

function parseYoutubeId(src) {
  return src.substr(src.indexOf('embed/') + 6);
}

function getVinePageURL(src) {
  return src.replace('embed/simple', '');
}

var cm = require('sdk/context-menu');

cm.Item({
  label: 'Send to mini player',
  context: cm.SelectorContext('[href*="youtube.com"], [href*="youtu.be"]'),
  contentScript: "self.on('click', function (node, data) {" +
                 '  self.postMessage(node.href);' +
                 '});',
  onMessage: function(url) {
    updatePanel(constructYoutubeEmbedUrl(url));
  }
});

cm.Item({
  label: 'Send to mini player',
  context: [
    cm.URLContext(['*.youtube.com']),
    cm.SelectorContext('[class*="yt-uix-sessionlink"]')
  ],
  contentScript: "self.on('click', function (node, data) {" +
                 '  self.postMessage(node.href);' +
                 '});',
  onMessage: function(url) {
    updatePanel(constructYoutubeEmbedUrl(url));
  }
});

cm.Item({
  label: "Send to mini player",
  context: [
    cm.PredicateContext(checkLocation),	
    cm.SelectorContext('[src*="mediasource:https://vine.co/"]')
  ],
  contentScript: "self.on('click', function (node, data) {" +
                 "  self.postMessage(document.URL);" +
                 "});",
  onMessage: function(url) {
    updatePanel(constructVineEmbedUrl(url));
  }
});

cm.Item({
  label: "Send to mini player",
  context: cm.SelectorContext('[href*="vine.co/v/"]'),  
  contentScript: "self.on('click', function (node, data) {" +
                 "  self.postMessage(node.href);" +
                 "});",
  onMessage: function(url) {
    updatePanel(constructVineEmbedUrlFromHref(url));
  }
});

function checkLocation(opts) {
  if ((opts.linkURL !== null) && (opts.linkURL.indexOf('vine.co/v/') > -1)) {
    return true;
  } else if ((opts.linkURL !== null) && (opts.linkURL.indexOf('twitter.com') > -1)) {
    return true;
  } else if ((opts.srcURL !== null) && (opts.srcURL.indexOf('vine.co/v/') > -1)) {
    return true;
  } else if ((opts.srcURL !== null) && (opts.srcURL.indexOf('twitter.com') > -1)) {
    return true;
  } else if ((opts.documentURL.indexOf('vine.co/v/') > -1)) {
    return true;
  } else {
    return false;
  }
}

function updatePanel(url) {
  panel.port.emit('set-video', url);
  panel.show();
}

function constructVineEmbedUrl(url) {
  if ((url.indexOf('vine') > -1) && (url.indexOf('embed') > -1)) {
    return url;
  } else if (url.indexOf('vine') > -1) {
    url = url + "/embed/simple";
    return url;
  }
}

function constructVineEmbedUrlFromHref(url) {
  url = url + "/embed/simple";
  return url;
}

function constructYoutubeEmbedUrl(url) {
  const params = qs.stringify({
    autoplay: 0,
    showinfo: 0,
    controls: 0,
    enablejsapi: 1,
    modestbranding: 1
  });

  return 'https://www.youtube.com/embed/' + require('get-youtube-id')(url) + '?' + params;
}
