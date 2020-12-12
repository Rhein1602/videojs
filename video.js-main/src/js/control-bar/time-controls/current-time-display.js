/**
 * @file current-time-display.js
 */
import TimeDisplay from './time-display';
import Component from '../../component.js';

/**
 * Displays the current time
 * 显示当前时间
 *
 * @extends Component
 */
class CurrentTimeDisplay extends TimeDisplay {

  /**
   * Builds the default DOM `className`.
   * 构建默认的DOM`className`。
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return 'vjs-current-time';
  }

  /**
   * Update current time display
   * 更新当前时间显示
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` event that caused this function to run.
   *
   * @listens Player#timeupdate
   */
  updateContent(event) {
    // Allows for smooth scrubbing, when player can't keep up.
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
 * The text that is added to the `CurrentTimeDisplay` for screen reader users.
 * 屏幕阅读器用户添加到“ CurrentTimeDisplay”中的文本。
 *
 * @type {string}
 * @private
 */
CurrentTimeDisplay.prototype.labelText_ = 'Current Time';

/**
 * The text that should display over the `CurrentTimeDisplay`s controls. Added to for localization.
 * 应该在“ CurrentTimeDisplay”控件上显示的文本。添加到本地化。
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; controlText_ is not used in non-active display Components
 */
CurrentTimeDisplay.prototype.controlText_ = 'Current Time';

Component.registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
export default CurrentTimeDisplay;
