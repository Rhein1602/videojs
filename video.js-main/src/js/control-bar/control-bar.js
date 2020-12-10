/**
 * @file control-bar.js
 */
import Component from '../component.js';
import document from 'global/document';

// Required children
import './play-toggle.js';
import './time-controls/current-time-display.js';
import './time-controls/duration-display.js';
import './time-controls/time-divider.js';
import './time-controls/remaining-time-display.js';
import './live-display.js';
import './seek-to-live.js';
import './progress-control/progress-control.js';
import './picture-in-picture-toggle.js';
import './fullscreen-toggle.js';
import './volume-panel.js';
import './text-track-controls/chapters-button.js';
import './text-track-controls/descriptions-button.js';
import './text-track-controls/subtitles-button.js';
import './text-track-controls/captions-button.js';
import './text-track-controls/subs-caps-button.js';
import './audio-track-controls/audio-track-button.js';
import './playback-rate-menu/playback-rate-menu-button.js';
import './spacer-controls/custom-control-spacer.js';
import './auto-play-next.js';
import './play-next.js';
// import './play-next.js';

/**
 * Container of main controls.
 *
 * @extends Component
 */
class ControlBar extends Component {

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-control-bar',
      dir: 'ltr'
    });
  }
}

/**
 * Default options for `ControlBar`
 *
 * @type {Object}
 * @private
 */
ControlBar.prototype.options_ = {
  children: [
    // 播放按钮
    'playToggle',
    'PlayNext',
    // 音量
    'volumePanel',
    // 已播放时间
    'currentTimeDisplay',
    // 分时器
    'timeDivider',
    // 总时间
    'durationDisplay',
    // 进度条
    'progressControl',
    // 剩余时间未知时使用，可能和直播相关
    'liveDisplay',
    // 剩余时间未知时使用，可能和直播相关
    'seekToLive',
    // 显示剩余时间
    'remainingTimeDisplay',
    // 客制化间隔，用于插入其他插件
    'customControlSpacer',
    // 倍数播放选项
    'playbackRateMenuButton',
    // 章节切换（作用不明）
    'chaptersButton',
    // 切换描述（作用不明）
    'descriptionsButton',
    // 字幕选择
    'subsCapsButton',
    // 音轨按钮
    'audioTrackButton',
    // 全屏控件
    'fullscreenToggle',
    'autoPlayNext'
  ]
};

if ('exitPictureInPicture' in document) {
  ControlBar.prototype.options_.children.splice(
    ControlBar.prototype.options_.children.length - 1,
    0,
    'pictureInPictureToggle'
  );
}

Component.registerComponent('ControlBar', ControlBar);
export default ControlBar;
