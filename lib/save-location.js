const { setTimeout } = require('sdk/timers');
const simpleStorage = require('sdk/simple-storage');

const DEFAULT_SCREEN_COORDS = {
  x: 10,
  y: 10
};

// _screenPosition holds the x,y screen coordinates where the user has dragged
// the window. The position is saved across sessions using SDK simple-storage.
let _screenPosition = simpleStorage.storage.screenPosition || DEFAULT_SCREEN_COORDS;

// Exports 'screenPosition', a property with both a getter and a setter.
module.exports = {
  get screenPosition() {
    return _screenPosition;
  },
  // Because simple-storage is synchronous, use a cached value whenever possible,
  // and update storage async (via setTimeout).
  set screenPosition(pos) {
    _screenPosition = pos;
    setTimeout(() => {
      simpleStorage.storage.screenPosition = pos;
    });
  },
  // Called on uninstall to clear out simple-storage
  destroy() {
    delete simpleStorage.storage.screenPosition;
  }
};
