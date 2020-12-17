/**
 * @file remaining-time-display.js
 */
import TimeDisplay from './time-display';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';

/**
 * 显示视频中剩余的时间
 *
 * @extends Component
 */
class RemainingTimeDisplay extends TimeDisplay {

  /**
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
   * 构建默认的DOM“类名”。
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return 'vjs-remaining-time';
  }

  /**
   * 创建“组件”的DOM元素，在时间前面加上“减号”
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
   * 更新剩余时间显示。
   *
   * @param {EventTarget~Event} [event]
   *        导致此运行的“timeupdate”或“durationchange”事件。
   *
   * @listens Player#timeupdate
   * @listens Player#durationchange
   */
  updateContent(event) {
    if (typeof this.player_.duration() !== 'number') {
      return;
    }

    let time;

    // @deprecated 我们应该只使用remainingTimeDisplay
    //从video.js 7开始
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
 * 为屏幕阅读器用户添加到“剩余时间显示”中的文本。
 *
 * @type {string}
 * @private
 */
RemainingTimeDisplay.prototype.labelText_ = 'Remaining Time';

/**
 * 应显示在“剩余时间显示”控件上的文本。添加到以进行本地化。
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; controlText_ is not used in non-active display Components
 */
RemainingTimeDisplay.prototype.controlText_ = 'Remaining Time';

Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
export default RemainingTimeDisplay;
