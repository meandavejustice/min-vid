document.querySelector('form').addEventListener('submit', function(ev) {
  ev.preventDefault();
  browser.storage.local.set({
    width: document.querySelector('#min-vid-width').value,
    height: document.querySelector('#min-vid-height').value
  });
});
