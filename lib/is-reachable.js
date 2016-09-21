const Request = require('sdk/request').Request;

module.exports = isReachable;

function isReachable(url, cb) {
  Request({
    url: url,
    onComplete: (resp) => cb(resp.status === 200)
  }).get();
}
