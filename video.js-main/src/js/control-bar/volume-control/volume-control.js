/**
 * @file volume-control.js
 */
import Component from '../../component.js';
import checkVolumeSupport from './check-volume-support';
import {isPlain} from '../../utils/obj';
import {throttle, bind, UPDATE_REFRESH_INTERVAL} from '../../utils/fn.js';

// Required children
import './volume-bar.js';

/**
 * The component for controlling the volume level
 * 控制音量的部件
 *
 * @extends Component
 */
class VolumeControl extends Component {

  /**
   * Creates an instance of this class.
   *
   * 创建实例
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *        这个类应该附加到的“Player”。
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   *        玩家选项的密钥/值存储。
   */
  constructor(player, options = {}) {
    options.vertical = options.vertical || false;

    // Pass the vertical option down to the VolumeBar if
    // the VolumeBar is turned on.
    //如果VolumeBar已打开，请将垂直选项向下传递到VolumeBar。
    if (typeof options.volumeBar === 'undefined' || isPlain(options.volumeBar)) {
      options.volumeBar = options.volumeBar || {};
      options.volumeBar.vertical = options.vertical;
    }

    super(player, options);

    // hide this control if volume support is missing
    //隐藏控制按钮当不实去音量调节
    checkVolumeSupport(this, player);

    this.throttledHandleMouseMove = throttle(bind(this, this.handleMouseMove), UPDATE_REFRESH_INTERVAL);

    this.on('mousedown', this.handleMouseDown);
    this.on('touchstart', this.handleMouseDown);

    // while the slider is active (the mouse has been pressed down and
    // is dragging) or in focus we do not want to hide the VolumeBar
    //当滑块处于活动状态（鼠标已被按下并正在拖动）或处于焦点时，我们不希望隐藏VolumeBar
    this.on(this.volumeBar, ['focus', 'slideractive'], () => {
      this.volumeBar.addClass('vjs-slider-active');
      this.addClass('vjs-slider-active');
      this.trigger('slideractive');
    });

    this.on(this.volumeBar, ['blur', 'sliderinactive'], () => {
      this.volumeBar.removeClass('vjs-slider-active');
      this.removeClass('vjs-slider-active');
      this.trigger('sliderinactive');
    });
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    let orientationClass = 'vjs-volume-horizontal';

    if (this.options_.vertical) {
      orientationClass = 'vjs-volume-vertical';
    }

    return super.createEl('div', {
      className: `vjs-volume-control vjs-control ${orientationClass}`
    });
  }

  /**
   * Handle `mousedown` or `touchstart` events on the `VolumeControl`.
   * 处理“VolumeControl”上的“mousedown”或“touchstart”事件。
   *
   * @param {EventTarget~Event} event
   *        `mousedown` or `touchstart` event that triggered this function
   *        处理“VolumeControl”上的“mousedown”或“touchstart”事件。
   *
   *
   * @listens mousedown
   * @listens touchstart
   */
  handleMouseDown(event) {
    const doc = this.el_.ownerDocument;

    this.on(doc, 'mousemove', this.throttledHandleMouseMove);
    this.on(doc, 'touchmove', this.throttledHandleMouseMove);
    this.on(doc, 'mouseup', this.handleMouseUp);
    this.on(doc, 'touchend', this.handleMouseUp);
  }

  /**
   * Handle `mouseup` or `touchend` events on the `VolumeControl`.
   * 处理“VolumeControl”上的“mouseup”或“touchend”事件。
   *
   * @param {EventTarget~Event} event
   *        `mouseup` or `touchend` event that triggered this function.
   *        触发此函数的mouseup或touchend事件。
   *
   * @listens touchend
   * @listens mouseup
   */
  handleMouseUp(event) {
    const doc = this.el_.ownerDocument;

    this.off(doc, 'mousemove', this.throttledHandleMouseMove);
    this.off(doc, 'touchmove', this.throttledHandleMouseMove);
    this.off(doc, 'mouseup', this.handleMouseUp);
    this.off(doc, 'touchend', this.handleMouseUp);
  }

  /**
   * Handle `mousedown` or `touchstart` events on the `VolumeControl`.
   * 处理“VolumeControl”上的“mousedown”或“touchstart”事件。
   *
   * @param {EventTarget~Event} event
   *        `mousedown` or `touchstart` event that triggered this function
   *        触发此函数的mousedown或touchstart事件
   *
   * @listens mousedown
   * @listens touchstart
   */
  handleMouseMove(event) {
    this.volumeBar.handleMouseMove(event);
  }
}

/**
 * Default options for the `VolumeControl`
 *`VolumeControl的默认选项`
 *
 * @type {Object}
 * @private
 */
VolumeControl.prototype.options_ = {
  children: [
    'volumeBar'
  ]
};

Component.registerComponent('VolumeControl', VolumeControl);
export default VolumeControl;
