/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

// Ping the addon when ready, and whenever the addon asks if we are ready.
self.port.emit('worker-ready');
self.port.on('worker-ready-check', () => {
  self.port.emit('worker-ready');
});

self.port.on('set-video', opts => {
  opts = Object.assign(opts, {
    loaded: false,
    progress: 0,
    playing: false
  });
  unsafeWindow.AppData = deepAssign(unsafeWindow.AppData, opts);
});

// Bridge between app.js window messages to the
// addon. We pass true for the wantsUntrusted param
// in order to access the message events. #82
window.addEventListener('addon-message', function(ev) {
  self.port.emit('addon-message', ev.detail);
}, false, true);

/*
 * since this file is not bundled, we cannot use the deep-assign
 * package that we are using in the client code.
 * from sindresorhus/deep-assign
 */

'use strict';
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function isObj(x) {
	var type = typeof x;
	return x !== null && (type === 'object' || type === 'function');
}

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Sources cannot be null or undefined');
	}

	return Object(val);
}

function assignKey(to, from, key) {
	var val = from[key];

	if (val === undefined || val === null) {
		return;
	}

	if (hasOwnProperty.call(to, key)) {
		if (to[key] === undefined || to[key] === null) {
			throw new TypeError('Cannot convert undefined or null to object (' + key + ')');
		}
	}

	if (!hasOwnProperty.call(to, key) || !isObj(val)) {
		to[key] = val;
	} else {
		to[key] = assign(Object(to[key]), from[key]);
	}
}

function assign(to, from) {
	if (to === from) {
		return to;
	}

	from = Object(from);

	for (var key in from) {
		if (hasOwnProperty.call(from, key)) {
			assignKey(to, from, key);
		}
	}

	if (Object.getOwnPropertySymbols) {
		var symbols = Object.getOwnPropertySymbols(from);

		for (var i = 0; i < symbols.length; i++) {
			if (propIsEnumerable.call(from, symbols[i])) {
				assignKey(to, from, symbols[i]);
			}
		}
	}

	return to;
}

function deepAssign(target) {
	target = toObject(target);

	for (var s = 1; s < arguments.length; s++) {
		assign(target, arguments[s]);
	}

	return target;
};
