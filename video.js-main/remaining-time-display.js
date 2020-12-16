/**
 * @file remaining-time-display.js ss
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
   * 创建此类的实例
   *
   * @param {Player} player
   *        这个类应该被附加到播放器
   *
   * @param {Object} [options]
   *        播放器选项的键值对存储
   */
  constructor(player, options) {
    super(player, options);
    this.on(player, 'durationchange', this.updateContent);
  }

  /**
   * 生成默认的DOM类名
   *
   * @return {string}
   *         这个对象的DOM类名
   */
  buildCSSClass() {
    return 'vjs-remaining-time';
  }

  /**
   *创建“ Component”的DOM元素，并在其前面加上“减号”
   *
   * @return {Element}
   *        创建的元素.
   */
  createEl() {
    const el = super.createEl();

    el.insertBefore(Dom.createEl('span', {}, {'aria-hidden': true}, '-'), this.contentEl_);
    return el;
  }

  /**
   * 更新剩余时间显示
   *
   * @param {EventTarget~Event} [event]
   *        导致该函数运行的`timeupdate`或`durationchange`事件。
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
 * 将`RemainingTimeDisplay`文本添加到播放器屏幕阅读器
 *
 * @type {string}
 * @private
 */
RemainingTimeDisplay.prototype.labelText_ = 'Remaining Time';

/**
 * 应该在“ RemainingTimeDisplay”控件上显示的文本。 添加到本地化。
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; 非活动显示组件中未使用controlText_
 */
RemainingTimeDisplay.prototype.controlText_ = 'Remaining Time';

Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
export default RemainingTimeDisplay;
