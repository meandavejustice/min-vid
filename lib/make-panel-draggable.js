const { getActiveView } = require('sdk/view/core');
const self = require('sdk/self');

module.exports = makePanelDraggable;

// Makes an SDK panel draggable. Pass in an SDK panel and an object of the
// form { width: 320, height: 180 }.
function makePanelDraggable(dimensions, sdkPanel, mouseupHandler) {
  // Remove the panel from the XUL DOM, make some attribute changes, then
  // reattach it. Reseating in the DOM triggers updates in the XBL bindings
  // that give the panel draggability and remove some SDK styling.

  // Note: sdkPanel is optional, used to avoid circular refs with panel-utils.js.
  sdkPanel = sdkPanel || require('./panel-utils.js').getPanel();

  const panel = getActiveView(sdkPanel);
  const frame = panel.getElementsByTagName('iframe')[0];
  const parent = panel.parentNode;

  parent.removeChild(panel);

  panel.setAttribute('backdrag', true);
  panel.setAttribute('style', '-moz-appearance: none; border: 0; margin: 0; background: rgba(0,0,0,0)');
  panel.removeAttribute('type');

  const doc = panel.ownerDocument;

  const dragHandle = doc.createElement('label');
  dragHandle.setAttribute('style', 'background: url("' + self.data.url('img/move-icon.svg') + '") center no-repeat; background-size: 15px 15px; cursor: grab');
  dragHandle.setAttribute('hidden', true);
  dragHandle.onmousedown = () => { dragHandle.style.cursor = 'grabbing' };
  dragHandle.onmouseup = () => {
    dragHandle.style.cursor = 'grab';
    // Notify panel-utils that the position has changed, without introducing a
    // circular dependency by require()ing that file here.
    mouseupHandler();
  };
  panel.appendChild(dragHandle);

  // Make the drag handle only visible on mouseover.
  panel.onmouseenter = (e) => {
    dragHandle.setAttribute('hidden', false);
    e.stopImmediatePropagation();
  };
  panel.onmouseleave = (e) => {
    dragHandle.setAttribute('hidden', true);
    e.stopImmediatePropagation();
  };

  // <stack> is the XUL way of permitting elements to be vertically offset:
  // position:absolute isn't available (apparently). The offset elements must
  // be children of the stack. We want the DOM to look like this:
  // <panel> (the SDK panel)
  //   <stack>
  //     <label> (the drag handle)
  //     <iframe> (the SDK panel contents iframe)
  //   </stack>
  // </panel>

  dragHandle.setAttribute('right', 125);
  dragHandle.setAttribute('top', 12);
  dragHandle.setAttribute('width', 15);
  dragHandle.setAttribute('height', 15);

  frame.setAttribute('left', 0);
  frame.setAttribute('top', 0);
  frame.setAttribute('width', dimensions.width);
  frame.setAttribute('height', dimensions.height);

  const stack = doc.createElement('stack');
  // Stack children are overlaid in order of insertion; put the frame
  // in first, so that the drag handle can be displayed on top of it.
  stack.appendChild(frame);
  stack.appendChild(dragHandle);
  panel.appendChild(stack);
  parent.appendChild(panel);
}
