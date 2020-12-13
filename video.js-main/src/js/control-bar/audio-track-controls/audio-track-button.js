/**
 * @file audio-track-button.js
 */
import TrackButton from '../track-button.js';
import Component from '../../component.js';
import AudioTrackMenuItem from './audio-track-menu-item.js';

/**
 * The base class for buttons that toggle specific {@link AudioTrack} types.
 *  用于切换特定轨道形式的按钮的基类
 * @extends TrackButton
 */
class AudioTrackButton extends TrackButton {

  /**
   * Creates an instance of this class.
   * 创建此类的实例。
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *        此类应附加到的“播放器”
   * @param {Object} [options={}]
   *        The key/value store of player options.
   *        播放器选项的键/值存储
   */
  constructor(player, options = {}) {
    options.tracks = player.audioTracks();

    super(player, options);
  }

  /**
   * Builds the default DOM `className`.
   * 构建默认的DOM`className`。
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
   * Create a menu item for each audio track
   * 为每个音轨创建一个菜单项
   *
   * @param {AudioTrackMenuItem[]} [items=[]]
   *        An array of existing menu items to use.
   *        要使用的现有菜单项的数组
   * @return {AudioTrackMenuItem[]}
   *         An array of menu items
   *         菜单项数组
   */
  createItems(items = []) {
    // if there's only one audio track, there no point in showing it
    //如果只有一个音轨，则没有必要显示
    this.hideThreshold_ = 1;

    const tracks = this.player_.audioTracks();

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      items.push(new AudioTrackMenuItem(this.player_, {
        track,
        // MenuItem is selectable
        //MenuItem是可选的
        selectable: true,
        // MenuItem is NOT multiSelectable (i.e. only one can be marked "selected" at a time)
        //MenuItem不可多重选择（即一次只能将一个标记为“已选择”）
        multiSelectable: false
      }));
    }

    return items;
  }
}

/**
 * The text that should display over the `AudioTrackButton`s controls. Added for localization.
 * 应该在“ AudioTrackButton”控件上显示的文本。 为本地化而添加
 *
 * @type {string}
 * @private
 */
AudioTrackButton.prototype.controlText_ = 'Audio Track';
Component.registerComponent('AudioTrackButton', AudioTrackButton);
export default AudioTrackButton;
