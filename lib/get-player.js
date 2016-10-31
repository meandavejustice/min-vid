module.exports = function(opts) {
  let player = 'video';

  if (opts.domain === 'youtube.com') player = 'youtube';
  if (opts.domain === 'soundcloud.com') player = 'audio';
  if (isAudio(opts.src)) player = 'audio';

  return player;
}

function isAudio(src) {
  const isSoundcloud = new RegExp('^(https?:)?//api.soundcloud.com\/tracks\/[0-9]+\/stream')
        .exec(src);
  const isAudio = new RegExp('^(https?:)?//*.+(.mp3|.opus|.weba|.ogg|.wav|.flac)')
        .exec(src);
  return Boolean(isSoundcloud || isAudio);
}
