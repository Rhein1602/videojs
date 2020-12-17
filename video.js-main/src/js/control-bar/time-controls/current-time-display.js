/**
 * @file current-time-display.js
 */
import TimeDisplay from './time-display';
import Component from '../../component.js';

/**
 * 显示当前时间
 *
 * @extends Component
 */
class CurrentTimeDisplay extends TimeDisplay {

  /**
   * 构建默认的DOM“类名”。
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return 'vjs-current-time';
  }

  /**
   * 更新当前时间显示
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` event that caused this function to run.
   *
   * @listens Player#timeupdate
   */
  updateContent(event) {
    // 当玩家跟不上时，允许平滑擦洗。
    let time;

    if (this.player_.ended()) {
      time = this.player_.duration();
    } else {
      time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();
    }

    this.updateTextNode_(time);
  }
}

/**
 * 为屏幕阅读器用户添加到“当前媒体显示”中的文本。
 *
 * @type {string}
 * @private
 */
CurrentTimeDisplay.prototype.labelText_ = 'Current Time';

/**
 * 应显示在“当前媒体显示”控件上的文本。添加到以进行本地化。
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; controlText_ is not used in non-active display Components
 */
CurrentTimeDisplay.prototype.controlText_ = 'Current Time';

Component.registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
export default CurrentTimeDisplay;
