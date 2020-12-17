/**
 * @file volume-control.js
 */
import Component from '../component.js';
import {isPlain} from '../utils/obj';
import * as Events from '../utils/events.js';
import * as Fn from '../utils/fn.js';
import keycode from 'keycode';
import document from 'global/document';

// Required children
import './volume-control/volume-control.js';
import './mute-toggle.js';

/**
 * A Component to contain the MuteToggle and VolumeControl so that
 * they can work together.
 *包含MuteToggle和VolumeControl使他们一起工作
 *
 * @extends Component
 */
class VolumePanel extends Component {

  /**
   * Creates an instance of this class.
   *
   * 创建实例
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  constructor(player, options = {}) {
    if (typeof options.inline !== 'undefined') {
      options.inline = options.inline;
    } else {
      options.inline = true;
    }

    // pass the inline option down to the VolumeControl as vertical if
    // the VolumeControl is on.
    //如果VolumeControl打开，则向下传递inline到VolumeControl作为垂直。
    if (typeof options.volumeControl === 'undefined' || isPlain(options.volumeControl)) {
      options.volumeControl = options.volumeControl || {};
      options.volumeControl.vertical = !options.inline;
    }

    super(player, options);

    this.on(player, ['loadstart'], this.volumePanelState_);
    this.on(this.muteToggle, 'keyup', this.handleKeyPress);
    this.on(this.volumeControl, 'keyup', this.handleVolumeControlKeyUp);
    this.on('keydown', this.handleKeyPress);
    this.on('mouseover', this.handleMouseOver);
    this.on('mouseout', this.handleMouseOut);

    // while the slider is active (the mouse has been pressed down and
    // is dragging) we do not want to hide the VolumeBar
    //保证滑块运动时不隐藏控制按钮
    this.on(this.volumeControl, ['slideractive'], this.sliderActive_);

    this.on(this.volumeControl, ['sliderinactive'], this.sliderInactive_);
  }

  /**
   * Add vjs-slider-active class to the VolumePanel
   * 将vjs-slider-active类添加到VolumePanel
   *
   * @listens VolumeControl#slideractive
   * @private
   */
  sliderActive_() {
    this.addClass('vjs-slider-active');
  }

  /**
   * Removes vjs-slider-active class to the VolumePanel
   *将vjs-slider-active类从VolumePanel中删除
   *
   * @listens VolumeControl#sliderinactive
   * @private
   */
  sliderInactive_() {
    this.removeClass('vjs-slider-active');
  }

  /**
   * Adds vjs-hidden or vjs-mute-toggle-only to the VolumePanel
   * depending on MuteToggle and VolumeControl state
   * 根据MuteToggle和VolumeControl状态，仅将vjs hidden或vjs mute toggle添加到VolumePanel
   *
   * @listens Player#loadstart
   * @private
   */
  volumePanelState_() {
    // hide volume panel if neither volume control or mute toggle
    // are displayed
    //如果未显示音量控制或静音切换，则隐藏音量面板
    if (this.volumeControl.hasClass('vjs-hidden') && this.muteToggle.hasClass('vjs-hidden')) {
      this.addClass('vjs-hidden');
    }

    // if only mute toggle is visible we don't want
    // volume panel expanding when hovered or active
    //如果只有静音切换是可见的，我们不希望音量面板扩大悬停或活动
    if (this.volumeControl.hasClass('vjs-hidden') && !this.muteToggle.hasClass('vjs-hidden')) {
      this.addClass('vjs-mute-toggle-only');
    }
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    let orientationClass = 'vjs-volume-panel-horizontal';

    if (!this.options_.inline) {
      orientationClass = 'vjs-volume-panel-vertical';
    }

    return super.createEl('div', {
      className: `vjs-volume-panel vjs-control ${orientationClass}`
    });
  }

  /**
   * Dispose of the `volume-panel` and all child components.
   * 丢弃“volume panel”和所有子组件。
   */
  dispose() {
    this.handleMouseOut();
    super.dispose();
  }

  /**
   * Handles `keyup` events on the `VolumeControl`, looking for ESC, which closes
   * the volume panel and sets focus on `MuteToggle`.
   * 处理“VolumeControl”上的“keyup”事件，查找ESC，后者关闭卷面板并将焦点设置为“MuteToggle”。
   *
   * @param {EventTarget~Event} event
   *        The `keyup` event that caused this function to be called.
   *
   * @listens keyup
   */
  handleVolumeControlKeyUp(event) {
    if (keycode.isEventKey(event, 'Esc')) {
      this.muteToggle.focus();
    }
  }

  /**
   * This gets called when a `VolumePanel` gains hover via a `mouseover` event.
   * Turns on listening for `mouseover` event. When they happen it
   * calls `this.handleMouseOver`.
   * 当“VolumePanel”通过“mouseover”事件悬停时调用此函数。打开监听“mouseover”事件。当他们发生的时候，反馈给`this.handleMouseOver`。
   *
   * @param {EventTarget~Event} event
   *        The `mouseover` event that caused this function to be called.
   *
   * @listens mouseover
   */
  handleMouseOver(event) {
    this.addClass('vjs-hover');
    Events.on(document, 'keyup', Fn.bind(this, this.handleKeyPress));
  }

  /**
   * This gets called when a `VolumePanel` gains hover via a `mouseout` event.
   * Turns on listening for `mouseout` event. When they happen it
   * calls `this.handleMouseOut`.
   * 当“VolumePanel”通过“mouseout”悬停时调用此函数事件。转弯监听mouseout事件。当他们发生的时候，反馈给`this.handleMouseOut`。
   *
   * @param {EventTarget~Event} event
   *        The `mouseout` event that caused this function to be called.
   *
   * @listens mouseout
   */
  handleMouseOut(event) {
    this.removeClass('vjs-hover');
    Events.off(document, 'keyup', Fn.bind(this, this.handleKeyPress));
  }

  /**
   * Handles `keyup` event on the document or `keydown` event on the `VolumePanel`,
   * looking for ESC, which hides the `VolumeControl`.
   * 处理文档上的“keyup”事件或“VolumePanel”上的“keydown”事件，查找隐藏“VolumeControl”的ESC。
   *
   * @param {EventTarget~Event} event
   *        The keypress that triggered this event.
   *
   * @listens keydown | keyup
   */
  handleKeyPress(event) {
    if (keycode.isEventKey(event, 'Esc')) {
      this.handleMouseOut();
    }
  }
}

/**
 * Default options for the `VolumeControl`
 *
 * @type {Object}
 * @private
 */
VolumePanel.prototype.options_ = {
  children: [
    'muteToggle',
    'volumeControl'
  ]
};

Component.registerComponent('VolumePanel', VolumePanel);
export default VolumePanel;
