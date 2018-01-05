const css = `
.minvid__modalDialog {
  position: fixed;
  font-family: Arial, Helvetica, sans-serif;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999999999;
}

.minvid__modalDialog > div {
  width: 35%;
  position: relative;
  margin: 10% auto;
  border-radius: 2px;
  background: #fff;
}

.minvid__modalDialog header {
  text-align: center;
  padding: 20px;
  background: #008ea4;
  color: white;
}

.minvid__modalDialog header h2 {
  font-weight: normal;
  font-size: 14px;
}

.minvid__modalDialog img {
  width: 90%;
  height: auto;
  margin: 15px auto;
  padding: 10px 26px 0px;
}

.minvid__modalDialog p {
  padding: 5px 20px 30px;
  width: 85%;
  margin: 0 auto;
  font-size: 14px;
}

.minvid__close {
  cursor: pointer;
  color: #FFFFFF;
  float: right;
  font-weight: bold;
  font-size: 14px;
}

.minvid__close:hover {
  opacity: .7;
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
  closeLink.textContent = 'X';

  closeLink.onclick = () => {
    document.querySelector('.minvid__modalDialog').remove();
  };

  const h2 = document.createElement('h2');
  h2.textContent = 'We\'ve added a little something to your videos';

  const img = document.createElement('img');
  img.src = browser.extension.getURL('/onboarding.gif');

  const p = document.createElement('p');
  p.textContent = `We\'re experimenting with a new feature which allows you to
  pop out web videos and audio from soundcloud into an always on top view so
  you can view videos the way you want.
  \n
  Just click the little icon in the top left corner to launch "Min Vid"
  \n
  \n
    - <3 Firefox Team
  `;

  const header = document.createElement('header');
  header.appendChild(closeLink);
  header.appendChild(h2);
  contentWrapper.appendChild(header);
  contentWrapper.appendChild(img);
  contentWrapper.appendChild(p);
  modal.appendChild(contentWrapper);
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

browser.storage.local.get('seenModal').then((storage) => {
  if (!storage.seenModal) {
    browser.storage.local.set({'seenModal': true});
    injectStyle();
    document.body.appendChild(createModal());
  }
});
