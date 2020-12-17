/**
 * Check if muting volume is supported and if it isn't hide the mute toggle
 * button.
 *检查是否支持静音音量，以及是否不隐藏静音切换按钮。
 *
 * @param {Component} self
 *        A reference to the mute toggle button
 *静音切换按钮的引用
 * @param {Player} player
 *        A reference to the player
 *        对player的引用
 * @private
 */
const checkMuteSupport = function(self, player) {
  // hide mute toggle button if it's not supported by the current tech
  //隐藏切换按钮
  if (player.tech_ && !player.tech_.featuresMuteControl) {
    self.addClass('vjs-hidden');
  }

  self.on(player, 'loadstart', function() {
    if (!player.tech_.featuresMuteControl) {
      self.addClass('vjs-hidden');
    } else {
      self.removeClass('vjs-hidden');
    }
  });
};

export default checkMuteSupport;
