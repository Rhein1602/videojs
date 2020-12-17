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
   * 生成默认的DOM`className`，类名
   *
   * @return {string}
   *         返回这个对象的DOM类名
   */
  buildCSSClass() {
    return 'vjs-current-time';
  }

  /**
   * 更新当前时间显示
   *
   * @param {EventTarget~Event} [event]
   *        timeupdate”事件触发此函数执行
   *
   * @listens Player#timeupdate
   */
  updateContent(event) {
    // 当播放器跟不上播放速度时，允许平滑地划过时间（cache中存放的时间与播放器实际播放时间比较）
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
 * 将文本'Current Time'添加到屏幕显示 `CurrentTimeDisplay`内容
 *
 * @type {string}
 * @private
 */
CurrentTimeDisplay.prototype.labelText_ = 'Current Time';

/**
 * 应该在“ CurrentTimeDisplay”控件上显示的文本。 添加到本地化
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7;非活动显示组件中未使用controlText_
 */
CurrentTimeDisplay.prototype.controlText_ = 'Current Time';

Component.registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
export default CurrentTimeDisplay;
