const hiddenFrames = require('sdk/frame/hidden-frame');
const isReachable = require('./is-reachable');

module.exports = getVineUrl;

// getVineUrl: Given a Vine video ID, returns URL of the video.
//
// Takes two arguments: the Vine video ID and a callback.
// The callback will be passed two arguments:
// the first argument is null or an error string,
// the second argument is the vine CDN URL of the mp4 video (or null).
function getVineUrl(id, cb) {
  const vineURL = `https://vine.co/v/${id}`;

  isReachable(vineURL, (up) => {
    if (!up) cb(`${vineURL} not reachable at this time`);
    else {
      const hiddenFrame = hiddenFrames.add(hiddenFrames.HiddenFrame({
        onReady: function() {
          this.element.contentWindow.location = vineURL;
          this.element.addEventListener('DOMContentLoaded', () => {
            const doc = this.element.contentDocument;
            const videoEl = doc.querySelector('meta[property="twitter:player:stream"]');
            const videoURL = videoEl ? videoEl.content : null;
            cb(null, videoURL);

            hiddenFrames.remove(hiddenFrame);
          });
        }
      }));
    }
  });
}
