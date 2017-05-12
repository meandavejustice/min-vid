export default function(obj) {
  window.pendingCommands.push(JSON.stringify(obj));
}
