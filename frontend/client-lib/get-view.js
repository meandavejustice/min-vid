export default function getView() {
  if (window.AppData.error) return 'error_view';
  if (window.AppData.exited) return 'replay_view';
  return window.AppData.loaded ? 'player_view' : 'loading_view';
}
