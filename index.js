/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

var panel = require("sdk/panel").Panel({
  contentURL: "./default.html",
  width: 300,
  heigth: 250,
  noautohide: true,
  position: {
    bottom: 10,
    left: 10
  }
});

var cm = require("sdk/context-menu");

cm.Item({
  label: "Send to mini player",
  context: cm.SelectorContext('[href*="youtube.com"]'),
  contentScript: 'self.on("click", function (node, data) {' +
                 '  self.postMessage(node.href);' +
                 '});',
  onMessage: function(url) {
    updatePanel(constructUrl(url));
  }
});

function updatePanel(url) {
  panel.contentURL = url;
  panel.show();
}

function constructUrl(url) {
  return "https://www.youtube.com/embed/" + require('get-youtube-id')(url);
}
