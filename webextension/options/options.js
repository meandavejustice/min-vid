document.querySelector('form').addEventListener('submit', function(ev) {
  ev.preventDefault();
  const widthEl = document.querySelector('#min-vid-width');
  const heightEl = document.querySelector('#min-vid-height');
  if ((widthEl.valueAsNumber > parseInt(widthEl.max, 10)) || (heightEl.valueAsNumber > parseInt(heightEl.max, 10))) return;
  browser.storage.local.set({
    width: widthEl.valueAsNumber,
    height: heightEl.valueAsNumber
  });
});

function restoreOptions() {
  browser.storage.local.get().then(r => {
    document.querySelector('#min-vid-width').value = r.width;
    document.querySelector('#min-vid-height').value = r.height;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
