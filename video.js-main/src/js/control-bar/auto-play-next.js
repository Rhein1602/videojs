/**
 * @file play-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';
import console from 'global/console';

let flag = true;

/**
 * Button to toggle between play and pause.
 * 播放暂停之间的切换按钮
 *
 * @extends Button
 */
class AutoPlayNext extends Button {

  /**
   * Creates an instance of this class.
   * 创建此类的实例。
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  constructor(player, options = {}) {
    super(player, options);

    // 显示或者隐藏图标
    options.replay = options.replay === undefined || options.replay;

    // 绑定监听器
    this.on(player, 'ended', this.handleEnded);

    flag = true;
  }

  /**
   * Builds the default DOM `className`.
   * 构建默认的DOM`className`。
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    // return `vjs-play-control ${super.buildCSSClass()}`;
    return 'autoplay-on';
  }

  /**
   * This gets called when an `Autoplay` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * 当点击autoplay图标时
   * 调用该方法
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    console.log('auto-play-next click: ' + flag);
    if (flag) {
      // 添加关闭自动播放的样式
      // 该样式见css文件
      this.addClass('autoplay-off');
      this.removeClass('autoplay-on');
      console.log('show ' + 'autoplay-off');
      this.off(this.player_, 'ended', this.handleEnded);
    } else {
      // 添加启用自动播放的样式
      // 该样式见css文件
      this.addClass('autoplay-on');
      this.removeClass('autoplay-off');
      console.log('show ' + 'autoplay-on');
      this.on(this.player_, 'ended', this.handleEnded);
    }
    flag = !flag;
  }

  /**
   * This gets called once after the video has ended and the user seeks so that
   * we can change the replay button back to a play button.
   *
   * 测试该组件是否能正常找到
   * 
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#seeked
   */
  handleSeeked(event) {
    console.log('play-next seeked');
  }

  /**
   * Add the vjs-playing class to the element so it can change appearance.
   *
   * 修改样式
   * 
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#play
   */
  handlePlay(event) {
    this.removeClass('vjs-ended');
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');
    // change the button text to "Pause"
    this.controlText('Pause');
  }

  /**
   * Add the vjs-paused class to the element so it can change appearance.
   *
   * 修改样式
   * 
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#pause
   */
  handlePause(event) {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    // change the button text to "Play"
    this.controlText('Play');
  }

  /**
   * Add the vjs-ended class to the element so it can change appearance
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#ended
   */
  handleEnded(event) {
    console.log('play-next ended');
    console.log(this.player_.options_.sources);
    let theSrc = this.player_.options_.sources[0];
    const len = this.player_.options_.sources.length;

    for (let i = 1; i < len; i++) {
      this.player_.options_.sources[i - 1] = this.player_.options_.sources[i];
    }
    this.player_.options_.sources[len - 1] = theSrc;
    theSrc = this.player_.options_.sources[0];
    this.player_.pause();
    this.player_.src(theSrc);
    this.player_.load();
    this.player_.play();
  }
}

/**
 * The text that should display over the `PlayNext`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
AutoPlayNext.prototype.controlText_ = 'autoPlayNext';

Component.registerComponent('autoPlayNext', AutoPlayNext);
export default AutoPlayNext;
