/**
 * @file duration-display.js
 */
import TimeDisplay from './time-display';
import Component from '../../component.js';

/**
 * 显示持续时间
 *
 * @extends Component
 */
class DurationDisplay extends TimeDisplay {

  /**
   * 创建此类的实例。
   *
   * @param {Player} player
   *        该类应附加到的“玩家”。
   *
   * @param {Object} [options]
   *        玩家选项的键/值存储。
   */
  constructor(player, options) {
    super(player, options);

    //我们不希望/不需要限制持续时间的改变，因为它们应该总是显示改变后的持续时间
    this.on(player, 'durationchange', this.updateContent);

    // 听loadstart，因为在加载新媒体元素时播放器持续时间被重置，但是用户代理上的持续时间更改不会触发。
    // @see [Spec]{@link https://www.w3.org/TR/2011/WD-html5-20110113/video.html#media-element-load-algorithm}
    this.on(player, 'loadstart', this.updateContent);

    // 还要监听timeupdate(在父进程中)并加载metadata，因为删除这些
    //侦听器可能已经破坏了相关的应用程序/库。这些
    //对于7.0可能会被删除。
    this.on(player, 'loadedmetadata', this.updateContent);
  }

  /**
   * 构建默认的DOM“类名”。
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return 'vjs-duration';
  }

  /**
   * 更新持续时间显示。
   *
   * @param {EventTarget~Event} [event]
   *        导致的“durationchange”、“timeupdate”或“loadedmetadata”事件
   *此函数将被调用。
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
 * 为屏幕阅读器用户添加到“持续时间显示”中的文本。
 *
 * @type {string}
 * @private
 */
DurationDisplay.prototype.labelText_ = 'Duration';

/**
 * 应显示在“工期显示”控件上的文本。添加到以进行本地化。
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; controlText_ is not used in non-active display Components
 */
DurationDisplay.prototype.controlText_ = 'Duration';

Component.registerComponent('DurationDisplay', DurationDisplay);
export default DurationDisplay;
