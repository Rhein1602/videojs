/**
 * @file audio-track-button.js
 */
import TrackButton from '../track-button.js';
import Component from '../../component.js';
import AudioTrackMenuItem from './audio-track-menu-item.js';

/**
 * 切换特定按钮的基类 {@link AudioTrack} types.
 *
 * @extends TrackButton
 */
class AudioTrackButton extends TrackButton {

  /**
   * 创建此类的实例。
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  constructor(player, options = {}) {
    options.tracks = player.audioTracks();

    super(player, options);
  }

  /**
   * 构建默认的DOM“类名”。
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-audio-button ${super.buildCSSClass()}`;
  }

  buildWrapperCSSClass() {
    return `vjs-audio-button ${super.buildWrapperCSSClass()}`;
  }

  /**
   * 为每个音轨创建一个菜单项
   *
   * @param {AudioTrackMenuItem[]} [items=[]]
   *        An array of existing menu items to use.
   *
   * @return {AudioTrackMenuItem[]}
   *         An array of menu items
   */
  createItems(items = []) {
    // 如果只有一个音轨，播放它就没有意义了
    this.hideThreshold_ = 1;

    const tracks = this.player_.audioTracks();

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      items.push(new AudioTrackMenuItem(this.player_, {
        track,
        // 菜单项是可选的
        selectable: true,
        // 菜单项不可多选(即一次只能选择一个菜单项)
        multiSelectable: false
      }));
    }

    return items;
  }
}

/**
 * 应显示在“音频跟踪按钮”控件上的文本。添加用于本地化。
 *
 * @type {string}
 * @private
 */
AudioTrackButton.prototype.controlText_ = 'Audio Track';
Component.registerComponent('AudioTrackButton', AudioTrackButton);
export default AudioTrackButton;
