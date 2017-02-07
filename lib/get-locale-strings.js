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
    trackAddedNotification: _('track_added_notification'),
    loadingMsg: _('loading_view_msg', mediaType, domain),
    contextMenuLabelPlay: _('content_menu_label_play'),
    contextMenuLabelAdd: _('content_menu_label_add'),
    confirmMsg: _('confirm_msg'),
    addConfirmMsg: _('add_confirm_msg'),
    playConfirmMsg: _('play_confirm_msg'),
    ttMute: _('tooltip_mute'),
    ttPlay: _('tooltip_play'),
    ttPause: _('tooltip_pause'),
    ttClose: _('tooltip_close'),
    ttUnmute: _('tooltip_unmute'),
    ttNext: _('tooltip_next'),
    ttPrev: _('tooltip_previous'),
    ttMinimize: _('tooltip_minimize'),
    ttMaximize: _('tooltip_maximize'),
    ttSendToTab: _('tooltip_send_to_tab'),
    ttSwitchVis: _('tooltip_switch_visual'),
    ttOpenQueue: _('tooltip_open_queue'),
    ttCloseQueue: _('tooltip_close_queue')
  });
}
