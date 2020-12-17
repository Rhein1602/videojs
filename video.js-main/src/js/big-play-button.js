/**
 * @file big-play-button.js
 */
import Button from './button.js';
import Component from './component.js';
import {isPromise, silencePromise} from './utils/promise';
import * as browser from './utils/browser.js';

/**
 * The initial play button that shows before the video has played. The hiding of the
 * `BigPlayButton` get done via CSS and `Player` states.
 * 在视频播放之前显示的初始播放按钮。隐藏“BigPlayButton”是通过CSS和“Player”状态来实现的。
 * @extends Button
 */
class BigPlayButton extends Button {
  constructor(player, options) {
    super(player, options);

    this.mouseused_ = false;

    this.on('mousedown', this.handleMouseDown);
  }

  /**
   * Builds the default DOM `className`.
   * 生成默认的DOM“className”。
   * @return {string}
   *         The DOM `className` for this object. Always returns 'vjs-big-play-button'.
   */
  buildCSSClass() {
    return 'vjs-big-play-button';
  }

  /**
   * This gets called when a `BigPlayButton` "clicked". See {@link ClickableComponent}
   * for more detailed information on what a click can be.
   * 当“单击”一个“BigPlayButton”时调用此函数。请参阅{@link ClickableComponent}以获取有关单击的详细信息。
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    const playPromise = this.player_.play();

    // exit early if clicked via the mouse
    // 如果通过鼠标单击，则提前退出
    if (this.mouseused_ && event.clientX && event.clientY) {
      const sourceIsEncrypted = this.player_.usingPlugin('eme') &&
                                this.player_.eme.sessions &&
                                this.player_.eme.sessions.length > 0;

      silencePromise(playPromise);
      if (this.player_.tech(true) &&
         // We've observed a bug in IE and Edge when playing back DRM content where
         // calling .focus() on the video element causes the video to go black,
         // so we avoid it in that specific case
         // 在回放DRM内容时，我们观察到IE和Edge中存在一个bug，在这个bug中，
         // 对video元素调用.focus（）会导致视频变黑，因此我们在特定情况下避免了它
         !((browser.IE_VERSION || browser.IS_EDGE) && sourceIsEncrypted)) {
        this.player_.tech(true).focus();
      }
      return;
    }

    const cb = this.player_.getChild('controlBar');
    const playToggle = cb && cb.getChild('playToggle');

    if (!playToggle) {
      this.player_.tech(true).focus();
      return;
    }

    const playFocus = () => playToggle.focus();

    if (isPromise(playPromise)) {
      playPromise.then(playFocus, () => {});
    } else {
      this.setTimeout(playFocus, 1);
    }
  }

  handleKeyDown(event) {
    this.mouseused_ = false;

    super.handleKeyDown(event);
  }

  handleMouseDown(event) {
    this.mouseused_ = true;
  }
}

/**
 * The text that should display over the `BigPlayButton`s controls. Added to for localization.
 * 应显示在“BigPlayButton”控件上的文本。添加到以进行本地化。
 * @type {string}
 * @private
 */
BigPlayButton.prototype.controlText_ = 'Play Video';

Component.registerComponent('BigPlayButton', BigPlayButton);
export default BigPlayButton;
