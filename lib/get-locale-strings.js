const _ = require('sdk/l10n').get;

module.exports = function(domain, isAudio) {
  const mediaType = isAudio ? _('media_type_audio') : _('media_type_video');

  return JSON.stringify({
    errorMsg: _('error_msg'),
    errorLink: _('error_link'),
    loadingMsg: _('loading_view_msg', mediaType, domain),
    ttMute: _('tooltip_mute'),
    ttPlay: _('tooltip_play'),
    ttPause: _('tooltip_pause'),
    ttClose: _('tooltip_close'),
    ttUnmute: _('tooltip_unmute'),
    ttMinimize: _('tooltip_minimize'),
    ttMaximize: _('tooltip_maximize'),
    ttSendToTab: _('tooltip_send_to_tab'),
    ttSwitchVis: _('tooltip_switch_visual'),
    ttScLimit: _('error_sc_limit'),
    ttScConnection: _('error_sc_connection'),
    ttScTrack: _('error_sc_not_track'),
    ttScStreamable: _('error_sc_not_streamable'),
    ttVimeoConnection: _('error_vimeo_connection'),
    ttVineConnection: _('error_vine_connection')
  });
}
