document.addEventListener('mozfullscreenchange', () => {
  browser.runtime.sendMessage({title: 'fullscreen-change'});
});
