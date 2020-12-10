/**
 * @file play-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';
import console from 'global/console';

/**
 * Button to toggle between play and pause.
 *
 * @extends Button
 */
class PlayNext extends Button {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  constructor(player, options = {}) {
    super(player, options);

    // show or hide replay icon
    options.replay = options.replay === undefined || options.replay;

    // 绑定监听器
    // if (options.replay) {
    //   this.on(player, 'ended', this.handleEnded);
    // }
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return 'vjs-icon-next-item';
  }

  /**
   * This gets called when an `PlayToggle` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    console.log('play-next click');
    console.log(this.player_.options_.sources);
    let theSrc = this.player_.options_.sources[0];
    const len = this.player_.options_.sources.length;

    // 资源数组长度
    // 更新资源数组
    for (let i = 1; i < len; i++) {
      this.player_.options_.sources[i - 1] = this.player_.options_.sources[i];
    }
    this.player_.options_.sources[len - 1] = theSrc;
    // 获取下一个资源
    theSrc = this.player_.options_.sources[0];
    this.player_.pause();
    // 重载资源
    this.player_.src(theSrc);
    this.player_.load();
    this.player_.play();
  }

  /**
   * This gets called once after the video has ended and the user seeks so that
   * we can change the replay button back to a play button.
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
PlayNext.prototype.controlText_ = 'PlayNext';

Component.registerComponent('PlayNext', PlayNext);
export default PlayNext;
