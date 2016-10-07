module.exports = sendToAddon;

function sendToAddon(obj) {
  window.pendingCommands.push(JSON.stringify(obj));
}
