const _ = require('sdk/l10n').get;

module.exports = function(domain) {
  return {
    errorMsg: _('error_msg'),
    errorLink: _('error_link'),
    loadingMsg: _('loading_msg', domain),
    ttMute: _('tooltip_mute'),
    ttPlay: _('tooltip_play'),
    ttPause: _('tooltip_pause'),
    ttClose: _('tooltip_close'),
    ttUnmute: _('tooltip_unmute'),
    ttMinimize: _('tooltip_minimize'),
    ttMaximize: _('tooltip_maximize'),
    ttSendToTab: _('tooltip_send_to_tab')
  };
}
