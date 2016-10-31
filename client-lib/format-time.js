module.exports = function(seconds) {
  const secondsInDay = 24 * 60 * 60;
  const days = Math.floor(seconds / secondsInDay);
  seconds = seconds % secondsInDay;
  const utc = new Date(seconds * 1000);
  return `${days}:${utc.toLocaleTimeString('en-US', {hour12: false, timeZone: 'UTC'})}`
    .replace(/^0:/, '') // Strip leading "0:" if days is empty.
    .replace(/^00:/, '') // Strip leading "00:" if hours is empty.
    .replace(/^0/, '');  // Strip leading "0" in minutes, if any.
}
