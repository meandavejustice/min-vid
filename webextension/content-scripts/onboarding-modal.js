const css = `
.minvid__modalDialog {
  position: fixed;
  font-family: Roboto, Arial, sans-serif;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999999999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.minvid__modalDialog > div {
  background: #fff;
  border-radius: 3px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, .2), 0 0 0 1px rgba(0,0,0,.05);
  min-width: 480px;
  overflow: hidden;
  position: relative;
  width: 35%;
}

.minvid__modalDialog header {
  text-align: center;
  padding: 0 20px;
  background: #008ea4;
  color: white;
  position: relative;
  display: flex;
  height: 60px;
  align-items: center;
  justify-content: center;
}

.minvid__modalDialog header h2 {
  font-weight: normal;
  font-size: 20px;
  margin: 0;
  font-weight: 500;
  flex: 0 1 380px;
}

.minvid__modalDialog img {
  width: 88%;
  height: auto;
  margin: 0 auto;
  padding: 25px 6% 20px;
}

.minvid__modalDialog p {
  padding: 5px 0 10px;
  width: 74%;
  margin: 0 auto;
  font-size: 16px;
  line-height: 24px;
}

.minvid__modalDialog p:last-child {
  margin-bottom: 36px;
}

.minvid__close {
  cursor: pointer;
  font-weight: bold;
  position: absolute;
  top: 0;
  right: 16px;
  width: 32px;
  height: 32px;
  background-size: 24px 24px;
  background-repeat: no-repeat;
  background-position: center center;
  top: 14px;
  border-radius: 2px;
  transition: backgroud-color 50ms;
}

.minvid__close:hover {
  background-color: rgba(0,0,0,.2);
}

@media (max-height: 540px) {

  .minvid__modalDialog {
    align-items: flex-start;
  }

  .minvid__modalDialog > div {
    margin-top: 10px;
  }

  .minvid__modalDialog p {
    padding: 4px 0 8px;
    font-size: 14px;
    line-height: 20px;
  }

  .minvid__modalDialog p:last-child {
    margin-bottom: 16px;
  }
}
`;

function createModal() {
  const modal = document.createElement('div');
  modal.className = 'minvid__modalDialog';

  const contentWrapper = document.createElement('div');

  const closeLink = document.createElement('a');
  closeLink.className = 'minvid__close';
  closeLink.id = 'minvid__close';
  closeLink.title = 'Close';
  closeLink.style.backgroundImage = `url(${browser.extension.getURL('/close.svg')})`;

  function dismissModal() {
    browser.storage.local.set({seenModal: true});
    let modal = document.querySelector('.minvid__modalDialog');
    if (!modal) return;
    modal.remove();
    modal = null;
    document.removeEventListener('keydown', onKeyDown);
  }

  closeLink.onclick = (evt) => {
    evt.preventDefault();
    dismissModal();
  };

  modal.onclick = (evt) => {
    evt.preventDefault();
    dismissModal();
  };

  let escaped;
  function onKeyDown(evt) {
    if (escaped || evt.key !== 'Escape') return;
    escaped = true;
    evt.preventDefault();
    dismissModal();
  }

  const h2 = document.createElement('h2');
  h2.textContent = 'Keep your videos front and center';

  const img = document.createElement('img');
  img.src = browser.extension.getURL('/onboarding.gif');

  const p1 = document.createElement('p');
  const p2 = document.createElement('p');

  p1.textContent = `New from Firefox,  an experimental feature that lets you play YouTube videos in the foreground while you browse.`;
  p2.textContent = `Select the icon in the top left corner of any video to give it a try.`;

  const header = document.createElement('header');
  header.appendChild(closeLink);
  header.appendChild(h2);
  contentWrapper.appendChild(header);
  contentWrapper.appendChild(img);
  contentWrapper.appendChild(p1);
  contentWrapper.appendChild(p2);
  modal.appendChild(contentWrapper);
  document.addEventListener('keydown', onKeyDown);
  return modal;
}

function injectStyle() {
  const style = document.createElement('style');

  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  document.head.appendChild(style);
}

injectStyle();
// timeout takes care of an edgecase where the modal would show up
// when refreshing a youtube tab that was already loaded in the browser
// before the shield study was installed. #1171
setTimeout(() => {
  document.body.appendChild(createModal());
}, 500);
