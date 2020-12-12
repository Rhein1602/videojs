/**
 * @file progress-control.js
 */
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import clamp from '../../utils/clamp.js';
import {bind, throttle, UPDATE_REFRESH_INTERVAL} from '../../utils/fn.js';

import './seek-bar.js';

/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress.
 * 进度控制组件包含拖动条，加载进度和播放进度。
 *
 * @extends Component
 */
class ProgressControl extends Component {

  /**
   * Creates an instance of this class.
   * 创建此类的实例。
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.handleMouseMove = throttle(bind(this, this.handleMouseMove), UPDATE_REFRESH_INTERVAL);
    this.throttledHandleMouseSeek = throttle(bind(this, this.handleMouseSeek), UPDATE_REFRESH_INTERVAL);

    this.enable();
  }

  /**
   * Create the `Component`'s DOM element
   * 创建`Component`的DOM元素
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-progress-control vjs-control'
    });
  }

  /**
   * When the mouse moves over the `ProgressControl`, the pointer position
   * gets passed down to the `MouseTimeDisplay` component.
   * 当鼠标移到“ ProgressControl”上时，指针位置将向下传递到“ MouseTimeDisplay”组件。
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this function to run.
   *
   * @listen mousemove
   */
  handleMouseMove(event) {
    const seekBar = this.getChild('seekBar');

    if (!seekBar) {
      return;
    }

    const playProgressBar = seekBar.getChild('playProgressBar');
    const mouseTimeDisplay = seekBar.getChild('mouseTimeDisplay');

    if (!playProgressBar && !mouseTimeDisplay) {
      return;
    }

    const seekBarEl = seekBar.el();
    const seekBarRect = Dom.findPosition(seekBarEl);
    let seekBarPoint = Dom.getPointerPosition(seekBarEl, event).x;


    // 默认外观在“ SeekBar”的两侧都有间隙。这意味着有可能在“ SeekBar”的边界之外触发此行为。这样可以确保我们始终都在其中。
    seekBarPoint = clamp(seekBarPoint, 0, 1);

    if (mouseTimeDisplay) {
      mouseTimeDisplay.update(seekBarRect, seekBarPoint);
    }

    if (playProgressBar) {
      playProgressBar.update(seekBarRect, seekBar.getProgress());
    }

  }

  /**
   * A throttled version of the {@link ProgressControl#handleMouseSeek} listener.
   * {@link ProgressControl＃handleMouseSeek}监听器的受限制的版本。
   *
   * @method ProgressControl#throttledHandleMouseSeek
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this function to run.
   *
   * @listen mousemove
   * @listen touchmove
   */

  /**
   * Handle `mousemove` or `touchmove` events on the `ProgressControl`.
   * 处理“ ProgressControl”上的“ mousemove”或“ touchmove”事件。
   *
   * @param {EventTarget~Event} event
   *        `mousedown` or `touchstart` event that triggered this function
   *
   * @listens mousemove
   * @listens touchmove
   */
  handleMouseSeek(event) {
    const seekBar = this.getChild('seekBar');

    if (seekBar) {
      seekBar.handleMouseMove(event);
    }
  }

  /**
   * Are controls are currently enabled for this progress control.
   * 当前是否为此进度控件启用控件。
   *
   * @return {boolean}
   *         true if controls are enabled, false otherwise
   */
  enabled() {
    return this.enabled_;
  }

  /**
   * Disable all controls on the progress control and its children
   * 禁用进度控件及其子控件上的所有控件
   */
  disable() {
    this.children().forEach((child) => child.disable && child.disable());

    if (!this.enabled()) {
      return;
    }

    this.off(['mousedown', 'touchstart'], this.handleMouseDown);
    this.off(this.el_, 'mousemove', this.handleMouseMove);
    this.handleMouseUp();

    this.addClass('disabled');

    this.enabled_ = false;
  }

  /**
   * Enable all controls on the progress control and its children
   * 对进度控件及其子控件启用所有控件
   */
  enable() {
    this.children().forEach((child) => child.enable && child.enable());

    if (this.enabled()) {
      return;
    }

    this.on(['mousedown', 'touchstart'], this.handleMouseDown);
    this.on(this.el_, 'mousemove', this.handleMouseMove);
    this.removeClass('disabled');

    this.enabled_ = true;
  }

  /**
   * Handle `mousedown` or `touchstart` events on the `ProgressControl`.
   * 处理“ ProgressControl”上的“ mousedown”或“ touchstart”事件。
   *
   * @param {EventTarget~Event} event
   *        `mousedown` or `touchstart` event that triggered this function
   *
   * @listens mousedown
   * @listens touchstart
   */
  handleMouseDown(event) {
    const doc = this.el_.ownerDocument;
    const seekBar = this.getChild('seekBar');

    if (seekBar) {
      seekBar.handleMouseDown(event);
    }

    this.on(doc, 'mousemove', this.throttledHandleMouseSeek);
    this.on(doc, 'touchmove', this.throttledHandleMouseSeek);
    this.on(doc, 'mouseup', this.handleMouseUp);
    this.on(doc, 'touchend', this.handleMouseUp);
  }

  /**
   * Handle `mouseup` or `touchend` events on the `ProgressControl`.
   * 处理“ ProgressControl”上的“ mouseup”或“ touchend”事件。
   *
   * @param {EventTarget~Event} event
   *        `mouseup` or `touchend` event that triggered this function.
   *
   * @listens touchend
   * @listens mouseup
   */
  handleMouseUp(event) {
    const doc = this.el_.ownerDocument;
    const seekBar = this.getChild('seekBar');

    if (seekBar) {
      seekBar.handleMouseUp(event);
    }

    this.off(doc, 'mousemove', this.throttledHandleMouseSeek);
    this.off(doc, 'touchmove', this.throttledHandleMouseSeek);
    this.off(doc, 'mouseup', this.handleMouseUp);
    this.off(doc, 'touchend', this.handleMouseUp);
  }
}

/**
 * Default options for `ProgressControl`
 * ProgressControl的默认选项
 *
 * @type {Object}
 * @private
 */
ProgressControl.prototype.options_ = {
  children: [
    'seekBar'
  ]
};

Component.registerComponent('ProgressControl', ProgressControl);
export default ProgressControl;
