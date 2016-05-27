/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

document.querySelector('.controls').style.display = 'none';
document.querySelector('.video-wrapper').style.display = 'none';

Array.from(document.querySelectorAll('a')).forEach(el => {
  el.addEventListener('click', ev => {
    ev.preventDefault();
    ev.stopPropagation();
    self.port.emit('link', {
      title: el.title,
      src: document.querySelector('iframe').src
    });
  });
});

document.querySelector('.controls [title="play"]').addEventListener('click', ev => {
  ytPlay();
});

document.querySelector('.controls [title="pause"]').addEventListener('click', ev => {
  ytPause();
});

document.querySelector('.controls [title="mute"]').addEventListener('click', ev => {
  ytToggleMute();
});

-self.port.on('set-video', url => {
  document.querySelector('iframe').src = url;
});

function ytPlay() {
  if (unsafeWindow.ytPlayer.getPlayerState() !== unsafeWindow.YT.PlayerState.PLAYING) {
    unsafeWindow.ytPlayer.playVideo();
  }
}

function ytToggleMute() {
  if (unsafeWindow.ytPlayer.isMuted()) {
    unsafeWindow.ytPlayer.unMute();
  } else {
    unsafeWindow.ytPlayer.mute();
  }
}

function ytPause() {
  if (unsafeWindow.ytPlayer.getPlayerState() === unsafeWindow.YT.PlayerState.PLAYING) {
    unsafeWindow.ytPlayer.pauseVideo();
  }
}
