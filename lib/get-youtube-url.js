const baseURL = 'https://www.youtube.com/embed';
const qs = require('sdk/querystring');

module.exports = getYouTubeUrl;

function getYouTubeUrl(videoId, cb, time, cc) {
  if (!cc) cc = false;

  const params = qs.stringify({
    autoplay: time ? 1 : 0,
    modestbranding: 1,
    controls: 0,
    disablekb: 0,
    enablejsapi: 1,
    fs: 0,
    cc_load_policy: +cc, // force boolean to number
    iv_load_policy: 3,
    loop: 0,
    rel: 0,
    showinfo: 0,
    start: parseInt(time, 10) || 0
  });

  // TODO: Find a way to find loading errors at this
  // stage. YouTube returns a 200 whether or not the
  // video exists, or is playable/embeddable. This
  // makes checks difficult. It would be nice to notify
  // the user as soon as possible, if the video cannot
  // be played.
  cb(null, `${baseURL}/${videoId}?${params}`);
}
