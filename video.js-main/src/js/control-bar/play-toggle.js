/**
 * @file play-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';

/**
 * Button to toggle between play and pause.
 * 在播放和暂停之间切换的按钮。
 *
 * @extends Button
 */
class PlayToggle extends Button {

  /**
   * Creates an instance of this class.
   * 播放按钮的实例
   *
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *        这个类应该附加到的“Player”。
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   *        玩家选项的密钥/值存储。
   */
  constructor(player, options = {}) {
    super(player, options);

    // show or hide replay icon
    //显示或隐藏重播图标
    options.replay = options.replay === undefined || options.replay;

    this.on(player, 'play', this.handlePlay);
    this.on(player, 'pause', this.handlePause);

    if (options.replay) {
      this.on(player, 'ended', this.handleEnded);
    }
  }

  /**
   * Builds the default DOM `className`.
   * 生成默认的“className”。
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-play-control ${super.buildCSSClass()}`;
  }

  /**
   * This gets called when an `PlayToggle` is "clicked". See
   * 按下状态的判断
   * {@link ClickableComponent} for more detailed information on what a click can be.
   * 有关单击的详细信息。
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  }

  /**
   * This gets called once after the video has ended and the user seeks so that
   * we can change the replay button back to a play button.
   * 在视频结束后，这个函数会被调用一次，用户需要这样我们就可以将重播按钮改回播放按钮。
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *        导致此函数运行的事件。
   *
   * @listens Player#seeked
   */
  handleSeeked(event) {
    this.removeClass('vjs-ended');

    if (this.player_.paused()) {
      this.handlePause(event);
    } else {
      this.handlePlay(event);
    }
  }

  /**
   * Add the vjs-playing class to the element so it can change appearance.
   * 将vjs playing类添加到元素中，以便它可以更改外观。
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *        导致此函数运行的事件。
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
   * 将vjs paused类添加到元素中，以便它可以更改外观。
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
   * 将vjs-ended结束类添加到元素中，以便它可以更改外观
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#ended
   */
  handleEnded(event) {
    this.removeClass('vjs-playing');
    this.addClass('vjs-ended');
    // change the button text to "Replay"
    this.controlText('Replay');

    // on the next seek remove the replay button
    this.one(this.player_, 'seeked', this.handleSeeked);
  }
}

/**
 * The text that should display over the `PlayToggle`s controls. Added for localization.
 * 应显示在为本地化添加的“playtogle”控件上的文本。
 *
 * @type {string}
 * @private
 */
PlayToggle.prototype.controlText_ = 'Play';

Component.registerComponent('PlayToggle', PlayToggle);
export default PlayToggle;
