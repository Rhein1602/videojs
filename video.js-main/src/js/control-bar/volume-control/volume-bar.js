/**
 * @file volume-bar.js
 */
import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';

// Required children
import './volume-level.js';

/**
 * The bar that contains the volume level and can be clicked on to adjust the level
 * 包含音量级别并可单击以调整音量的栏
 *
 * @extends Slider
 */
class VolumeBar extends Slider {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *        这个类应该附加到的“Player”。
   * @param {Object} [options]
   *        The key/value store of player options.
   *        玩家选项的密钥/值存储。
   */
  constructor(player, options) {
    super(player, options);
    this.on('slideractive', this.updateLastVolume_);
    this.on(player, 'volumechange', this.updateARIAAttributes);
    player.ready(() => this.updateARIAAttributes());
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   *         创建的元素。
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-volume-bar vjs-slider-bar'
    }, {
      'aria-label': this.localize('Volume Level'),
      'aria-live': 'polite'
    });
  }

  /**
   * Handle mouse down on volume bar
   *在音量条上按住鼠标
   * @param {EventTarget~Event} event
   *        The `mousedown` event that caused this to run.
   *        导致此事件运行的“mousedown”事件。
   *
   * @listens mousedown
   */
  handleMouseDown(event) {
    if (!Dom.isSingleLeftClick(event)) {
      return;
    }

    super.handleMouseDown(event);
  }

  /**
   * Handle movement events on the {@link VolumeMenuButton}.
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run.
   *        导致此函数运行的事件。
   *
   * @listens mousemove
   */
  handleMouseMove(event) {
    if (!Dom.isSingleLeftClick(event)) {
      return;
    }

    this.checkMuted();
    this.player_.volume(this.calculateDistance(event));
  }

  /**
   * If the player is muted unmute it.
   * 如果播放器静音，请取消静音。
   */
  checkMuted() {
    if (this.player_.muted()) {
      this.player_.muted(false);
    }
  }

  /**
   * Get percent of volume level
   * 获取音量百分比
   *
   * @return {number}
   *         Volume level percent as a decimal number.
   */
  getPercent() {
    if (this.player_.muted()) {
      return 0;
    }
    return this.player_.volume();
  }

  /**
   * Increase volume level for keyboard users
   * 增加键盘用户的音量
   */
  stepForward() {
    this.checkMuted();
    this.player_.volume(this.player_.volume() + 0.1);
  }

  /**
   * Decrease volume level for keyboard users
   * 降低键盘用户的音量
   */
  stepBack() {
    this.checkMuted();
    this.player_.volume(this.player_.volume() - 0.1);
  }

  /**
   * Update ARIA accessibility attributes
   * 更新ARIA辅助功能属性
   *
   * @param {EventTarget~Event} [event]
   *        The `volumechange` event that caused this function to run.
   *
   * @listens Player#volumechange
   */
  updateARIAAttributes(event) {
    const ariaValue = this.player_.muted() ? 0 : this.volumeAsPercentage_();

    this.el_.setAttribute('aria-valuenow', ariaValue);
    this.el_.setAttribute('aria-valuetext', ariaValue + '%');
  }

  /**
   * Returns the current value of the player volume as a percentage
   * 以百分比形式返回播放机音量的当前值
   *
   * @private
   */
  volumeAsPercentage_() {
    return Math.round(this.player_.volume() * 100);
  }

  /**
   * When user starts dragging the VolumeBar, store the volume and listen for
   * the end of the drag. When the drag ends, if the volume was set to zero,
   * set lastVolume to the stored volume.
   *
   * 当用户开始拖动卷bar时，存储该卷并监听拖动的结束。当拖动结束时，如果卷设置为零，请将lastVolume设置为存储的卷。
   *
   * @listens slideractive
   * @private
   */
  updateLastVolume_() {
    const volumeBeforeDrag = this.player_.volume();

    this.one('sliderinactive', () => {
      if (this.player_.volume() === 0) {
        this.player_.lastVolume_(volumeBeforeDrag);
      }
    });
  }

}

/**
 * Default options for the `VolumeBar`
 * `VolumeBar的默认选项`
 *
 * @type {Object}
 * @private
 */
VolumeBar.prototype.options_ = {
  children: [
    'volumeLevel'
  ],
  barName: 'volumeLevel'
};

/**
 * Call the update event for this Slider when this event happens on the player.
 * 当此事件发生在播放器上时，调用此滑块的更新事件。
 *
 * @type {string}
 */
VolumeBar.prototype.playerEvent = 'volumechange';

Component.registerComponent('VolumeBar', VolumeBar);
export default VolumeBar;
