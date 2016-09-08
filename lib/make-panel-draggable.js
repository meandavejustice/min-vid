const { getActiveView } = require('sdk/view/core');

module.exports = makePanelDraggable;

// Makes an SDK panel draggable. Pass in an SDK panel.
function makePanelDraggable(sdkPanel) {
  // Remove the panel from the XUL DOM, make some attribute changes, then
  // reattach it. Reseating in the DOM triggers updates in the XBL bindings
  // that give the panel draggability and remove some SDK styling.
  const panel = getActiveView(sdkPanel);
  const parent = panel.parentNode;

  parent.removeChild(panel);

  panel.setAttribute('noautohide', true);
  panel.setAttribute('backdrag', true);
  panel.setAttribute('style', '-moz-appearance: none; cursor: grab; border: 0; margin: 0; padding: 24px; background: rgba(0,0,0,0);');
  panel.removeAttribute('type');

  // Toggling -moz-appearance shows a background area with colors that reflect
  // the system color scheme.
  panel.onmouseenter = () => { panel.style.MozAppearance = 'menupopup'; }
  panel.onmouseleave = () => { panel.style.MozAppearance = 'none'; }
  panel.onmousedown = () => { panel.style.cursor = 'grabbing'; }
  panel.onmouseup = () => { panel.style.cursor = 'grab'; }

  parent.appendChild(panel);
}
