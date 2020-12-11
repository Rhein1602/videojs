/**
 * @file duration-display.js
 */
import TimeDisplay from './time-display';
import Component from '../../component.js';

/**
 * Displays the duration
 * 显示持续时间
 *
 * @extends Component
 */
class DurationDisplay extends TimeDisplay {

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

    // we do not want to/need to throttle duration changes,
    // as they should always display the changed duration as
    // it has changed
    // 我们不想/不需要限制持续时间的更改，因为它们应该始终显示更改后的更改后的持续时间
    this.on(player, 'durationchange', this.updateContent);

    // Listen to loadstart because the player duration is reset when a new media element is loaded,
    // but the durationchange on the user agent will not fire.
    // 收听loadstart，因为在加载新的媒体元素时会重置播放器的持续时间，但是不会触发用户代理上的duration更改。
    // @see [Spec]{@link https://www.w3.org/TR/2011/WD-html5-20110113/video.html#media-element-load-algorithm}
    this.on(player, 'loadstart', this.updateContent);

    // Also listen for timeupdate (in the parent) and loadedmetadata because removing those
    // listeners could have broken dependent applications/libraries. These
    // can likely be removed for 7.0.
    // 还监听timeupdate（在父级中）和loadmetadata，因为删除那些监听器可能会破坏相关的应用程序/库。这些可能会在7.0中删除。
    this.on(player, 'loadedmetadata', this.updateContent);
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return 'vjs-duration';
  }

  /**
   * Update duration time display.
   * 更新持续时间显示。
   *
   * @param {EventTarget~Event} [event]
   *        The `durationchange`, `timeupdate`, or `loadedmetadata` event that caused
   *        this function to be called.
   *
   * @listens Player#durationchange
   * @listens Player#timeupdate
   * @listens Player#loadedmetadata
   */
  updateContent(event) {
    const duration = this.player_.duration();

    this.updateTextNode_(duration);
  }
}

/**
 * The text that is added to the `DurationDisplay` for screen reader users.
 * 屏幕阅读器用户添加到“ DurationDisplay”中的文本。
 *
 * @type {string}
 * @private
 */
DurationDisplay.prototype.labelText_ = 'Duration';

/**
 * The text that should display over the `DurationDisplay`s controls. Added to for localization.
 * 应该在“ DurationDisplay”控件上显示的文本。添加到本地化。
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; controlText_ is not used in non-active display Components
 */
DurationDisplay.prototype.controlText_ = 'Duration';

Component.registerComponent('DurationDisplay', DurationDisplay);
export default DurationDisplay;
