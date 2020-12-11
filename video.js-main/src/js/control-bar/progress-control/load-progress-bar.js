/**
 * @file load-progress-bar.js
 */
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import clamp from '../../utils/clamp';
import document from 'global/document';

// 得到时间宽度与总时间的百分比
const percentify = (time, end) => clamp((time / end) * 100, 0, 100).toFixed(2) + '%';

/**
 * Shows loading progress
 * 显示加载进度
 *
 * @extends Component
 */
class LoadProgressBar extends Component {

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
    this.partEls_ = [];
    this.on(player, 'progress', this.update);
  }

  /**
   * Create the `Component`'s DOM element
   * 创建`Component`的DOM元素
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl('div', {className: 'vjs-load-progress'});
    const wrapper = Dom.createEl('span', {className: 'vjs-control-text'});
    const loadedText = Dom.createEl('span', {textContent: this.localize('Loaded')});
    const separator = document.createTextNode(': ');

    this.percentageEl_ = Dom.createEl('span', {
      className: 'vjs-control-text-loaded-percentage',
      textContent: '0%'
    });

    el.appendChild(wrapper);
    wrapper.appendChild(loadedText);
    wrapper.appendChild(separator);
    wrapper.appendChild(this.percentageEl_);

    return el;
  }

  dispose() {
    this.partEls_ = null;
    this.percentageEl_ = null;

    super.dispose();
  }

  /**
   * Update progress bar
   * 更新进度条
   *
   * @param {EventTarget~Event} [event]
   *        The `progress` event that caused this function to run.
   *
   * @listens Player#progress
   */
  update(event) {
    this.requestNamedAnimationFrame('LoadProgressBar#update', () => {
      const liveTracker = this.player_.liveTracker;
      const buffered = this.player_.buffered();
      const duration = (liveTracker && liveTracker.isLive()) ? liveTracker.seekableEnd() : this.player_.duration();
      const bufferedEnd = this.player_.bufferedEnd();
      const children = this.partEls_;
      const percent = percentify(bufferedEnd, duration);

      if (this.percent_ !== percent) {
        // 更新进度条的width
        this.el_.style.width = percent;
        // 更新control-text
        Dom.textContent(this.percentageEl_, percent);
        this.percent_ = percent;
      }

      // 添加子元素以代表各个缓冲时间范围
      for (let i = 0; i < buffered.length; i++) {
        const start = buffered.start(i);
        const end = buffered.end(i);
        let part = children[i];

        if (!part) {
          part = this.el_.appendChild(Dom.createEl());
          children[i] = part;
        }

        // 仅在更改时更新
        if (part.dataset.start === start && part.dataset.end === end) {
          continue;
        }

        part.dataset.start = start;
        part.dataset.end = end;

        // 根据进度条的宽度设置百分比（bufferedEnd）
        part.style.left = percentify(start, bufferedEnd);
        part.style.width = percentify(end - start, bufferedEnd);
      }

      // 删除未使用的缓冲范围元素
      for (let i = children.length; i > buffered.length; i--) {
        this.el_.removeChild(children[i - 1]);
      }
      children.length = buffered.length;
    });
  }
}

Component.registerComponent('LoadProgressBar', LoadProgressBar);
export default LoadProgressBar;
