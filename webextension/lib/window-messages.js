export {send, close, prepareWindow, minimize, maximize, dimensionsUpdate, fullscreenChange};
const port = browser.runtime.connect({name: 'connection-to-legacy'});

function prepareWindow() {
  port.postMessage({content: 'window:prepare'});
}

function send(data) {
  port.postMessage({
    content: 'window:send',
    data: data
  });
}

function close() {
  port.postMessage({content: 'window:close'});
}

function minimize() {
  port.postMessage({content: 'window:minimize'});
}

function maximize() {
  port.postMessage({content: 'window:maximize'});
}

function dimensionsUpdate(data) {
  port.postMessage({
    content: 'window:dimensions:update',
    data: data
  });
}

function fullscreenChange() {
  port.postMessage({content: 'window:fullscreen:change'});
}
