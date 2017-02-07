const _ = require('sdk/l10n').get;

module.exports = function(domain, isAudio) {
  const mediaType = isAudio ? _('media_type_audio') : _('media_type_video');

  return JSON.stringify({
    errorMsg: _('error_msg'),
    errorLink: _('error_link'),
    errorYTNotFound: _('error_youtube_not_found'),
    errorYTNotAllowed: _('error_youtube_not_allowed'),
    errorScLimit: _('error_sc_limit'),
    errorScConnection: _('error_sc_connection'),
    errorScTrack: _('error_sc_not_track'),
    errorScStreamable: _('error_sc_not_streamable'),
    errorScRestricted: _('error_sc_restricted'),
    errorVimeoConnection: _('error_vimeo_connection'),
    errorVineConnection: _('error_vine_connection'),
    loadingMsg: _('loading_view_msg', mediaType, domain),
    ttMute: _('tooltip_mute'),
    ttPlay: _('tooltip_play'),
    ttPause: _('tooltip_pause'),
    ttClose: _('tooltip_close'),
    ttUnmute: _('tooltip_unmute'),
    ttMinimize: _('tooltip_minimize'),
    ttMaximize: _('tooltip_maximize'),
    ttSendToTab: _('tooltip_send_to_tab'),
    ttSwitchVis: _('tooltip_switch_visual')
  });
}
