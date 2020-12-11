/**
 * @file time-display.js
 */
import document from 'global/document';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import formatTime from '../../utils/format-time.js';

/**
 * Displays time information about the video
 * 显示有关视频的时间信息
 *
 * @extends Component
 */
class TimeDisplay extends Component {

  /**
   * Creates an instance of this class.
   * 创建实例
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);

    this.on(player, ['timeupdate', 'ended'], this.updateContent);
    this.updateTextNode_();
  }

  /**
   * Create the `Component`'s DOM element
   * 创建`Component`的DOM元素
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const className = this.buildCSSClass();
    const el = super.createEl('div', {
      className: `${className} vjs-time-control vjs-control`,
      innerHTML: `<span class="vjs-control-text" role="presentation">${this.localize(this.labelText_)}\u00a0</span>`
    });

    this.contentEl_ = Dom.createEl('span', {
      className: `${className}-display`
    }, {
      // tell screen readers not to automatically read the time as it changes
      // 告诉屏幕阅读器不要自动读取时间的变化
      'aria-live': 'off',
      // span elements have no implicit role, but some screen readers (notably VoiceOver)
      // treat them as a break between items in the DOM when using arrow keys
      // (or left-to-right swipes on iOS) to read contents of a page. Using
      // role='presentation' causes VoiceOver to NOT treat this span as a break.
      // span元素没有隐式作用，
      // 但是某些屏幕阅读器（尤其是VoiceOver）在使用箭头键（或在iOS上从左向右滑动）读取页面内容时，
      // 将它们视为DOM中各项之间的中断。使用role ='presentation'会使VoiceOver不会将此跨度视为中断。
      'role': 'presentation'
    });

    el.appendChild(this.contentEl_);
    return el;
  }

  dispose() {
    this.contentEl_ = null;
    this.textNode_ = null;

    super.dispose();
  }

  /**
   * Updates the time display text node with a new time
   * 用新的更新时间显示文本节点
   *
   * @param {number} [time=0] the time to update to
   *
   * @private
   */
  updateTextNode_(time = 0) {
    time = formatTime(time);

    if (this.formattedTime_ === time) {
      return;
    }

    this.formattedTime_ = time;

    this.requestNamedAnimationFrame('TimeDisplay#updateTextNode_', () => {
      if (!this.contentEl_) {
        return;
      }

      const oldNode = this.textNode_;

      this.textNode_ = document.createTextNode(this.formattedTime_);

      if (!this.textNode_) {
        return;
      }

      if (oldNode) {
        this.contentEl_.replaceChild(this.textNode_, oldNode);
      } else {
        this.contentEl_.appendChild(this.textNode_);
      }
    });
  }

  /**
   * To be filled out in the child class, should update the displayed time
   * in accordance with the fact that the current time has changed.
   * 要在子类中填写，应根据当前时间已更改的事实来更新显示的时间。
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate`  event that caused this to run.
   *
   * @listens Player#timeupdate
   */
  updateContent(event) {}
}

/**
 * The text that is added to the `TimeDisplay` for screen reader users.
 * 屏幕阅读器用户添加到“ TimeDisplay”中的文本。
 *
 * @type {string}
 * @private
 */
TimeDisplay.prototype.labelText_ = 'Time';

/**
 * The text that should display over the `TimeDisplay`s controls. Added to for localization.
 * 应该在“ TimeDisplay”控件上显示的文本。添加到本地化。
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; controlText_ is not used in non-active display Components
 */
TimeDisplay.prototype.controlText_ = 'Time';

Component.registerComponent('TimeDisplay', TimeDisplay);
export default TimeDisplay;
