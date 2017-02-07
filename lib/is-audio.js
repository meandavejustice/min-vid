module.exports = function(src) {
  const isSoundcloud = new RegExp('^(https?:)?//api.soundcloud.com\/tracks\/[0-9]+\/stream')
        .exec(src);
  const isAudio = new RegExp('^(https?:)?//*.+(.mp3|.opus|.weba|.ogg|.wav|.flac)')
        .exec(src);
  return Boolean(isSoundcloud || isAudio);
}
