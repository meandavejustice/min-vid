module.exports = function() {
  require('sdk/util/uuid').uuid().toString().slice(1, -1);
}
