/**
 * @file seek-bar.js
 */
import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import {IS_IOS, IS_ANDROID} from '../../utils/browser.js';
import * as Dom from '../../utils/dom.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';
import {silencePromise} from '../../utils/promise';
import keycode from 'keycode';
import document from 'global/document';

import './load-progress-bar.js';
import './play-progress-bar.js';
import './mouse-time-display.js';

// “ step *”功能移动时间轴的秒数。
const STEP_SECONDS = 5;

// PgUp / PgDown移动时间轴的STEP_SECONDS乘数。
const PAGE_KEY_MULTIPLIER = 12;

/**
 * Seek bar and container for the progress bars. Uses {@link PlayProgressBar}
 * as its `bar`.
 * 寻找进度条的栏和容器。使用{@link PlayProgressBar}作为其“ bar”。
 *
 * @extends Slider
 */
class SeekBar extends Slider {

  /**
   * Creates an instance of this class.
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
    this.setEventHandlers_();
  }

  /**
   * Sets the event handlers
   * 设置事件处理程序
   *
   * @private
   */
  setEventHandlers_() {
    this.update_ = Fn.bind(this, this.update);
    this.update = Fn.throttle(this.update_, Fn.UPDATE_REFRESH_INTERVAL);

    this.on(this.player_, ['ended', 'durationchange', 'timeupdate'], this.update);
    if (this.player_.liveTracker) {
      this.on(this.player_.liveTracker, 'liveedgechange', this.update);
    }

    // 播放时，请确保我们通过一定间隔来平滑更新播放进度条
    this.updateInterval = null;

    this.on(this.player_, ['playing'], this.enableInterval_);

    this.on(this.player_, ['ended', 'pause', 'waiting'], this.disableInterval_);

    // we don't need to update the play progress if the document is hidden,
    // also, this causes the CPU to spike and eventually crash the page on IE11.
    // 如果文档被隐藏，我们也不需要更新播放进度，这也会导致CPU峰值并最终使IE11上的页面崩溃。
    if ('hidden' in document && 'visibilityState' in document) {
      this.on(document, 'visibilitychange', this.toggleVisibility_);
    }
  }

  toggleVisibility_(e) {
    if (document.hidden) {
      this.disableInterval_(e);
    } else {
      this.enableInterval_();

      // we just switched back to the page and someone may be looking, so, update ASAP
      // 我们刚切换回该页面，可能有人在寻找，因此，请尽快更新
      this.update();
    }
  }

  enableInterval_() {
    if (this.updateInterval) {
      return;

    }
    this.updateInterval = this.setInterval(this.update, Fn.UPDATE_REFRESH_INTERVAL);
  }

  disableInterval_(e) {
    if (this.player_.liveTracker && this.player_.liveTracker.isLive() && e && e.type !== 'ended') {
      return;
    }

    if (!this.updateInterval) {
      return;
    }

    this.clearInterval(this.updateInterval);
    this.updateInterval = null;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-progress-holder'
    }, {
      'aria-label': this.localize('Progress Bar')
    });
  }

  /**
   * This function updates the play progress bar and accessibility
   * attributes to whatever is passed in.
   * 此功能更新播放进度条和辅助功能属性传递给任何传入的内容。
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` or `ended` event that caused this to run.
   *
   * @listens Player#timeupdate
   *
   * @return {number}
   *          The current percent at a number from 0-1
   */
  update(event) {
    const percent = super.update();

    this.requestNamedAnimationFrame('SeekBar#update', () => {
      const currentTime = this.player_.ended() ?
        this.player_.duration() : this.getCurrentTime_();
      const liveTracker = this.player_.liveTracker;
      let duration = this.player_.duration();

      if (liveTracker && liveTracker.isLive()) {
        duration = this.player_.liveTracker.liveCurrentTime();
      }

      if (this.percent_ !== percent) {
        // machine readable value of progress bar (percentage complete)
        // 完成百分比
        this.el_.setAttribute('aria-valuenow', (percent * 100).toFixed(2));
        this.percent_ = percent;
      }

      if (this.currentTime_ !== currentTime || this.duration_ !== duration) {
        // human readable value of progress bar (time complete)
        // 完成时间
        this.el_.setAttribute(
          'aria-valuetext',
          this.localize(
            'progress bar timing: currentTime={1} duration={2}',
            [formatTime(currentTime, duration),
              formatTime(duration, duration)],
            '{1} of {2}'
          )
        );

        this.currentTime_ = currentTime;
        this.duration_ = duration;
      }

      // update the progress bar time tooltip with the current time
      // 用当前时间更新进度条时间工具提示
      if (this.bar) {
        this.bar.update(Dom.getBoundingClientRect(this.el()), this.getProgress());
      }
    });

    return percent;
  }

  /**
   * Get the value of current time but allows for smooth scrubbing,
   * when player can't keep up.
   * 获取当前时间的值，但是当用户无法跟上时可以进行平滑的回退。
   *
   * @return {number}
   *         The current time value to display
   *
   * @private
   */
  getCurrentTime_() {
    return (this.player_.scrubbing()) ?
      this.player_.getCache().currentTime :
      this.player_.currentTime();
  }

  /**
   * Get the percentage of media played so far.
   * 获取到目前为止播放的媒体百分比。
   *
   * @return {number}
   *         The percentage of media played so far (0 to 1).
   */
  getPercent() {
    const currentTime = this.getCurrentTime_();
    let percent;
    const liveTracker = this.player_.liveTracker;

    if (liveTracker && liveTracker.isLive()) {
      percent = (currentTime - liveTracker.seekableStart()) / liveTracker.liveWindow();

      // prevent the percent from changing at the live edge
      if (liveTracker.atLiveEdge()) {
        percent = 1;
      }
    } else {
      percent = currentTime / this.player_.duration();
    }

    return percent;
  }

  /**
   * Handle mouse down on seek bar
   * 将鼠标移到搜索栏上
   *
   * @param {EventTarget~Event} event
   *        The `mousedown` event that caused this to run.
   *
   * @listens mousedown
   */
  handleMouseDown(event) {
    if (!Dom.isSingleLeftClick(event)) {
      return;
    }

    // Stop event propagation to prevent double fire in progress-control.js
    // 停止事件传播，以防止progress-control.js中触发两次
    event.stopPropagation();
    this.player_.scrubbing(true);

    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause();

    super.handleMouseDown(event);
  }

  /**
   * Handle mouse move on seek bar
   * 处理鼠标在搜索栏上的移动
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this to run.
   *
   * @listens mousemove
   */
  handleMouseMove(event) {
    if (!Dom.isSingleLeftClick(event)) {
      return;
    }
    let newTime;
    const distance = this.calculateDistance(event);
    const liveTracker = this.player_.liveTracker;

    if (!liveTracker || !liveTracker.isLive()) {
      newTime = distance * this.player_.duration();

      // Don't let video end while scrubbing.
      // 擦洗时不要让视频结束。
      if (newTime === this.player_.duration()) {
        newTime = newTime - 0.1;
      }
    } else {

      if (distance >= 0.99) {
        liveTracker.seekToLiveEdge();
        return;
      }
      const seekableStart = liveTracker.seekableStart();
      const seekableEnd = liveTracker.liveCurrentTime();

      newTime = seekableStart + (distance * liveTracker.liveWindow());

      // Don't let video end while scrubbing.
      // 擦洗时不要让视频结束。
      if (newTime >= seekableEnd) {
        newTime = seekableEnd;
      }

      // Compensate for precision differences so that currentTime is not less
      // than seekable start
      // 补偿精度差异，使currentTime不小于可搜索的开始
      if (newTime <= seekableStart) {
        newTime = seekableStart + 0.1;
      }

      // 在android上，seekableEnd有时可以为Infinity，这将导致newTime为Infinity，这不是有效的currentTime。
      if (newTime === Infinity) {
        return;
      }
    }

    // Set new time (tell player to seek to new time)
    // 设置新时间（告诉玩家寻找新时间）
    this.player_.currentTime(newTime);
  }

  enable() {
    super.enable();
    const mouseTimeDisplay = this.getChild('mouseTimeDisplay');

    if (!mouseTimeDisplay) {
      return;
    }

    mouseTimeDisplay.show();
  }

  disable() {
    super.disable();
    const mouseTimeDisplay = this.getChild('mouseTimeDisplay');

    if (!mouseTimeDisplay) {
      return;
    }

    mouseTimeDisplay.hide();
  }

  /**
   * Handle mouse up on seek bar
   * 将鼠标移到搜索栏上
   *
   * @param {EventTarget~Event} event
   *        The `mouseup` event that caused this to run.
   *
   * @listens mouseup
   */
  handleMouseUp(event) {
    super.handleMouseUp(event);

    // Stop event propagation to prevent double fire in progress-control.js
    // 停止事件传播，以防止progress-control.js中发生两次火灾
    if (event) {
      event.stopPropagation();
    }
    this.player_.scrubbing(false);

    /**
     * Trigger timeupdate because we're done seeking and the time has changed.
     * This is particularly useful for if the player is paused to time the time displays.
     * 因为我们已经完成搜索并且时间已更改，所以触发了时间更新。
     * 这对于播放器暂停时间显示时间很有用。
     *
     * @event Tech#timeupdate
     * @type {EventTarget~Event}
     */
    this.player_.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
    if (this.videoWasPlaying) {
      silencePromise(this.player_.play());
    } else {
      // We're done seeking and the time has changed.
      // If the player is paused, make sure we display the correct time on the seek bar.
      // 我们已经完成寻找，时间已经改变。如果播放器暂停，请确保我们在搜索栏上显示正确的时间。
      this.update_();
    }
  }

  /**
   * Move more quickly fast forward for keyboard-only users
   * 仅键盘用户可以更快地快速前进
   */
  stepForward() {
    this.player_.currentTime(this.player_.currentTime() + STEP_SECONDS);
  }

  /**
   * Move more quickly rewind for keyboard-only users
   * 仅键盘用户可以更快地快退
   */
  stepBack() {
    this.player_.currentTime(this.player_.currentTime() - STEP_SECONDS);
  }

  /**
   * Toggles the playback state of the player
   * This gets called when enter or space is used on the seekbar
   * 切换播放器的播放状态。在搜索栏上使用Enter或空格时会调用此方法
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called
   *
   */
  handleAction(event) {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  }

  /**
   * Called when this SeekBar has focus and a key gets pressed down.
   * Supports the following keys:
   * 当此SeekBar具有焦点并且按下某个键时调用。支持以下键：
   *
   *   空格键或Enter键触发点击事件
   *   主页键移到时间线的开始
   *   结束键移到时间线的结尾
   *   数字“ 0”到“ 9”键移动到时间线的0％，10％... 80％，90％
   *   PageDown键比ArrowDown键向后移更大的一步
   *   PageUp键向前迈出了一大步
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {
    if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
      event.preventDefault();
      event.stopPropagation();
      this.handleAction(event);
    } else if (keycode.isEventKey(event, 'Home')) {
      event.preventDefault();
      event.stopPropagation();
      this.player_.currentTime(0);
    } else if (keycode.isEventKey(event, 'End')) {
      event.preventDefault();
      event.stopPropagation();
      this.player_.currentTime(this.player_.duration());
    } else if (/^[0-9]$/.test(keycode(event))) {
      event.preventDefault();
      event.stopPropagation();
      const gotoFraction = (keycode.codes[keycode(event)] - keycode.codes['0']) * 10.0 / 100.0;

      this.player_.currentTime(this.player_.duration() * gotoFraction);
    } else if (keycode.isEventKey(event, 'PgDn')) {
      event.preventDefault();
      event.stopPropagation();
      this.player_.currentTime(this.player_.currentTime() - (STEP_SECONDS * PAGE_KEY_MULTIPLIER));
    } else if (keycode.isEventKey(event, 'PgUp')) {
      event.preventDefault();
      event.stopPropagation();
      this.player_.currentTime(this.player_.currentTime() + (STEP_SECONDS * PAGE_KEY_MULTIPLIER));
    } else {
      // Pass keydown handling up for unsupported keys
      // 传递keydown处理不支持的密钥
      super.handleKeyDown(event);
    }
  }

  dispose() {
    this.disableInterval_();

    this.off(this.player_, ['ended', 'durationchange', 'timeupdate'], this.update);
    if (this.player_.liveTracker) {
      this.on(this.player_.liveTracker, 'liveedgechange', this.update);
    }

    this.off(this.player_, ['playing'], this.enableInterval_);
    this.off(this.player_, ['ended', 'pause', 'waiting'], this.disableInterval_);

    // we don't need to update the play progress if the document is hidden,
    // also, this causes the CPU to spike and eventually crash the page on IE11.
    // 如果文档被隐藏，我们也不需要更新播放进度，这也会导致CPU峰值并最终使IE11上的页面崩溃。
    if ('hidden' in document && 'visibilityState' in document) {
      this.off(document, 'visibilitychange', this.toggleVisibility_);
    }

    super.dispose();
  }
}

/**
 * Default options for the `SeekBar`
 *
 * @type {Object}
 * @private
 */
SeekBar.prototype.options_ = {
  children: [
    'loadProgressBar',
    'playProgressBar'
  ],
  barName: 'playProgressBar'
};

// 不应将MouseTimeDisplay工具提示添加到移动设备上的播放器中
if (!IS_IOS && !IS_ANDROID) {
  SeekBar.prototype.options_.children.splice(1, 0, 'mouseTimeDisplay');
}

Component.registerComponent('SeekBar', SeekBar);
export default SeekBar;
