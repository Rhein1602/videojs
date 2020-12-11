/**
 * @file time-tooltip.js
 */
import Component from '../../component';
import * as Dom from '../../utils/dom.js';
import formatTime from '../../utils/format-time.js';
import * as Fn from '../../utils/fn.js';

/**
 * Time tooltips display a time above the progress bar.
 * 时间工具提示在进度条上方显示一个时间。
 *
 * @extends Component
 */
class TimeTooltip extends Component {

  /**
   * Creates an instance of this class.
   * 创建此类的实例。
   *
   * @param {Player} player
   *        The {@link Player} that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.update = Fn.throttle(Fn.bind(this, this.update), Fn.UPDATE_REFRESH_INTERVAL);
  }

  /**
   * Create the time tooltip DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-time-tooltip'
    }, {
      'aria-hidden': 'true'
    });
  }

  /**
   * Updates the position of the time tooltip relative to the `SeekBar`.
   * 更新时间工具提示相对于“ SeekBar”的位置。
   *
   * @param {Object} seekBarRect
   *        The `ClientRect` for the {@link SeekBar} element.
   *
   * @param {number} seekBarPoint
   *        A number from 0 to 1, representing a horizontal reference point
   *        from the left edge of the {@link SeekBar}
   * @param {String} content
   *        the content
   */
  update(seekBarRect, seekBarPoint, content) {
    const tooltipRect = Dom.findPosition(this.el_);
    const playerRect = Dom.getBoundingClientRect(this.player_.el());
    const seekBarPointPx = seekBarRect.width * seekBarPoint;

    // do nothing if either rect isn't available
    // for example, if the player isn't in the DOM for testing
    // 如果任何一个rect不可用，例如，如果播放器不在DOM中进行测试，则不执行任何操作
    if (!playerRect || !tooltipRect) {
      return;
    }

    // This is the space left of the `seekBarPoint` available within the bounds
    // of the player. We calculate any gap between the left edge of the player
    // and the left edge of the `SeekBar` and add the number of pixels in the
    // `SeekBar` before hitting the `seekBarPoint`
    // 这是`seekBarPoint`的剩余空间，可在播放器范围内使用。
    // 我们计算播放器左边缘与`SeekBar`左边缘之间的任何距离，并在达到`seekBarPoint`之前在`SeekBar`中添加像素数。
    const spaceLeftOfPoint = (seekBarRect.left - playerRect.left) + seekBarPointPx;

    // This is the space right of the `seekBarPoint` available within the bounds
    // of the player. We calculate the number of pixels from the `seekBarPoint`
    // to the right edge of the `SeekBar` and add to that any gap between the
    // right edge of the `SeekBar` and the player.
    // 这是`seekBarPoint`的空间权，它在播放器的范围内可用。
    // 我们计算从“ seekBarPoint”到“ SeekBar”右边缘的像素数，并增加“ SeekBar”右边缘与播放器之间的任何间隙。
    const spaceRightOfPoint = (seekBarRect.width - seekBarPointPx) +
      (playerRect.right - seekBarRect.right);

    // This is the number of pixels by which the tooltip will need to be pulled
    // further to the right to center it over the `seekBarPoint`.
    // 这是工具提示需要向右进一步拉动以使其在`seekBarPoint`上居中的像素数。
    let pullTooltipBy = tooltipRect.width / 2;

    // Adjust the `pullTooltipBy` distance to the left or right depending on
    // the results of the space calculations above.
    // 根据上面的空间计算结果，将“ pullTooltipBy”距离调整到左侧或右侧。
    if (spaceLeftOfPoint < pullTooltipBy) {
      pullTooltipBy += pullTooltipBy - spaceLeftOfPoint;
    } else if (spaceRightOfPoint < pullTooltipBy) {
      pullTooltipBy = spaceRightOfPoint;
    }

    // Due to the imprecision of decimal/ratio based calculations and varying
    // rounding behaviors, there are cases where the spacing adjustment is off
    // by a pixel or two. This adds insurance to these calculations.
    // 由于基于十进制/比率的计算不精确，并且舍入行为有所变化，因此在某些情况下，间距调整会偏离一两个像素。
    // 这为这些计算增加了保险。
    if (pullTooltipBy < 0) {
      pullTooltipBy = 0;
    } else if (pullTooltipBy > tooltipRect.width) {
      pullTooltipBy = tooltipRect.width;
    }

    this.el_.style.right = `-${pullTooltipBy}px`;
    this.write(content);
  }

  /**
   * Write the time to the tooltip DOM element.
   * 将时间写入工具提示DOM元素。
   *
   * @param {string} content
   *        The formatted time for the tooltip.
   */
  write(content) {
    Dom.textContent(this.el_, content);
  }

  /**
   * Updates the position of the time tooltip relative to the `SeekBar`.
   * 更新时间工具提示相对于“ SeekBar”的位置。
   *
   * @param {Object} seekBarRect
   *        The `ClientRect` for the {@link SeekBar} element.
   *
   * @param {number} seekBarPoint
   *        A number from 0 to 1, representing a horizontal reference point
   *        from the left edge of the {@link SeekBar}
   *
   * @param {number} time
   *        The time to update the tooltip to, not used during live playback
   *
   * @param {Function} cb
   *        A function that will be called during the request animation frame
   *        for tooltips that need to do additional animations from the default
   */
  updateTime(seekBarRect, seekBarPoint, time, cb) {
    this.requestNamedAnimationFrame('TimeTooltip#updateTime', () => {
      let content;
      const duration = this.player_.duration();

      if (this.player_.liveTracker && this.player_.liveTracker.isLive()) {
        const liveWindow = this.player_.liveTracker.liveWindow();
        const secondsBehind = liveWindow - (seekBarPoint * liveWindow);

        content = (secondsBehind < 1 ? '' : '-') + formatTime(secondsBehind, liveWindow);
      } else {
        content = formatTime(time, duration);
      }

      this.update(seekBarRect, seekBarPoint, content);
      if (cb) {
        cb();
      }
    });
  }
}

Component.registerComponent('TimeTooltip', TimeTooltip);
export default TimeTooltip;
