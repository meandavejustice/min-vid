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
  padding: 10px;
  background: #008ea4;
  color: white;
}

.minvid__modalDialog img {
  width: 90%;
  height: auto;
  margin: 0 auto;
  padding: 10px 26px;
}

.minvid__modalDialog p {
  padding: 20px;
}

.minvid__close {
  background: #606061;
  color: #FFFFFF;
  line-height: 25px;
  position: absolute;
  right: -12px;
  text-align: center;
  top: -10px;
  width: 24px;
  text-decoration: none;
  font-weight: bold;
    -webkit-border-radius: 12px;
    -moz-border-radius: 12px;
  border-radius: 12px;
    -moz-box-shadow: 1px 1px 3px #000;
    -webkit-box-shadow: 1px 1px 3px #000;
  box-shadow: 1px 1px 3px #000;
}
.minvid__close:hover {
  background: #00d9ff;
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
    document.querySelector('minvid__modalDialog').remove();
  };

  const h2 = document.createElement('h2');
  h2.textContent = 'We\'ve added a little something to your videos';

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

  const img = document.createElement('img');
  img.src = 'https://github.com/meandavejustice/min-vid/raw/master/docs/images/launching.gif';

  const header = document.createElement('header');
  header.appendChild(closeLink);
  header.appendChild(h2);
  contentWrapper.appendChild(header);
  contentWrapper.appendChild(p);
  contentWrapper.appendChild(img);
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

injectStyle();
document.body.appendChild(createModal());
