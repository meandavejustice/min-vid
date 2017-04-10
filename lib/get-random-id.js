module.exports = function() {
  return require('sdk/util/uuid').uuid().number.replace('{','').replace('}','');
}
