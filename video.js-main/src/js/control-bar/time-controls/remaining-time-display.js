/**
 * @file remaining-time-display.js
 */
import TimeDisplay from './time-display';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';

/**
 * Displays the time left in the video
 * 显示视频中剩余的时间
 *
 * @extends Component
 */
class RemainingTimeDisplay extends TimeDisplay {

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
    this.on(player, 'durationchange', this.updateContent);
  }

  /**
   * Builds the default DOM `className`.
   * 构建默认的DOM`className`。
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return 'vjs-remaining-time';
  }

  /**
   * Create the `Component`'s DOM element with the "minus" characted prepend to the time
   * 创建“ Component”的DOM元素，并在其前面加上“减号”
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl();

    el.insertBefore(Dom.createEl('span', {}, {'aria-hidden': true}, '-'), this.contentEl_);
    return el;
  }

  /**
   * Update remaining time display.
   * 更新剩余时间显示。
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` or `durationchange` event that caused this to run.
   *
   * @listens Player#timeupdate
   * @listens Player#durationchange
   */
  updateContent(event) {
    if (typeof this.player_.duration() !== 'number') {
      return;
    }

    let time;

    // @deprecated We should only use remainingTimeDisplay
    // as of video.js 7
    if (this.player_.ended()) {
      time = 0;
    } else if (this.player_.remainingTimeDisplay) {
      time = this.player_.remainingTimeDisplay();
    } else {
      time = this.player_.remainingTime();
    }

    this.updateTextNode_(time);
  }
}

/**
 * The text that is added to the `RemainingTimeDisplay` for screen reader users.
 * 屏幕阅读器用户添加到“ RemainingTimeDisplay”中的文本。
 *
 * @type {string}
 * @private
 */
RemainingTimeDisplay.prototype.labelText_ = 'Remaining Time';

/**
 * The text that should display over the `RemainingTimeDisplay`s controls. Added to for localization.
 * 应该在“ RemainingTimeDisplay”控件上显示的文本。添加到本地化。
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; controlText_ is not used in non-active display Components
 */
RemainingTimeDisplay.prototype.controlText_ = 'Remaining Time';

Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
export default RemainingTimeDisplay;
