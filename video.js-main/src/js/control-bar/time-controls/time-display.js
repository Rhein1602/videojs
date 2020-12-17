/**
 * @file time-display.js
 */
import document from 'global/document';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import formatTime from '../../utils/format-time.js';

/**
 * 显示视频的时间信息
 *
 * @extends Component
 */
class TimeDisplay extends Component {

  /**
   * 创建此类的实例
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
   * 创建“组件”的DOM元素
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
      // 告诉屏幕阅读器不要在时间改变时自动读取时间
      'aria-live': 'off',
      // span元素没有隐含的作用，但是当使用箭头键时，
      //一些屏幕阅读器(特别是VoiceOver)将它们视为DOM中项目之间的中断
      //(或者在iOS上从左向右滑动)来读取页面内容。使用角色=“演示”会导致画外音不将此
      //跨度视为中断。
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
   * 用新时间更新时间显示文本节点
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
   * 要在子类中填写，应该更新显示的时间
   *根据当前时间已经改变的事实。
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate`  event that caused this to run.
   *
   * @listens Player#timeupdate
   */
  updateContent(event) {}
}

/**
 * 为屏幕阅读器用户添加到“时间显示”的文本。
 *
 * @type {string}
 * @private
 */
TimeDisplay.prototype.labelText_ = 'Time';

/**
 * 应显示在“时间显示”控件上的文本。添加到以进行本地化。
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; controlText_ is not used in non-active display Components
 */
TimeDisplay.prototype.controlText_ = 'Time';

Component.registerComponent('TimeDisplay', TimeDisplay);
export default TimeDisplay;
