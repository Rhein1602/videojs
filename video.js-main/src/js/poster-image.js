/**
 * @file poster-image.js
 */
import ClickableComponent from './clickable-component.js';
import Component from './component.js';
import * as Fn from './utils/fn.js';
import * as Dom from './utils/dom.js';
import {silencePromise} from './utils/promise';
import * as browser from './utils/browser.js';

/**
 * 一个“ClickableComponent”，用于显示播放机的海报图像.
 *
 * @extends ClickableComponent
 */
class PosterImage extends ClickableComponent {

  /**
   * 创建此类的实例。
   *
   * @param {Player} player
   *        The `Player` that this class should attach to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);

    this.update();
    player.on('posterchange', Fn.bind(this, this.update));
  }

  /**
   * 清理并处理“PosterImage”。
   */
  dispose() {
    this.player().off('posterchange', this.update);
    super.dispose();
  }

  /**
   * 创建`PosterImage`的DOM元素。
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl() {
    const el = Dom.createEl('div', {
      className: 'vjs-poster',

      // 不想让海报上有标签。
      tabIndex: -1
    });

    return el;
  }

  /**
   * An {@link EventTarget~EventListener} for {@link Player#posterchange} events.
   *
   * @listens Player#posterchange
   *
   * @param {EventTarget~Event} [event]
   *        触发此函数的“Player\posterchange”事件。
   */
  update(event) {
    const url = this.player().poster();

    this.setSrc(url);

    // 如果没有海报来源，我们应该显示：无打开此组件
    // 所以它不能点击或右键点击
    if (url) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   *根据显示方法设置“PosterImage”的源。
   *
   * @param {string} url
   *       “PosterImage”的源的URL。
   */
  setSrc(url) {
    let backgroundImage = '';

    // 任何错误的值都应该保持为空字符串，否则将引发额外的错误
    if (url) {
      backgroundImage = `url("${url}")`;
    }

    this.el_.style.backgroundImage = backgroundImage;
  }

  /**
   * An {@link EventTarget~EventListener} for clicks on the `PosterImage`. See
   * {@link ClickableComponent#handleClick} for instances where this will be triggered.
   *
   * @listens tap
   * @listens click
   * @listens keydown
   *
   * @param {EventTarget~Event} event
   +        The `click`, `tap` or `keydown` event that caused this function to be called.
   */
  handleClick(event) {
    // 当控件被禁用时，我们不希望点击触发播放
    if (!this.player_.controls()) {
      return;
    }

    const sourceIsEncrypted = this.player_.usingPlugin('eme') &&
                                this.player_.eme.sessions &&
                                this.player_.eme.sessions.length > 0;

    if (this.player_.tech(true) &&
    // 我们观察到IE和Edge在播放DRM内容时发现了一个bug
    //，对video元素调用.focus（）会导致视频变黑
    // 所以我们在具体的情况下就避免了
    !((browser.IE_VERSION || browser.IS_EDGE) && sourceIsEncrypted)) {
      this.player_.tech(true).focus();
    }

    if (this.player_.paused()) {
      silencePromise(this.player_.play());
    } else {
      this.player_.pause();
    }
  }

}

Component.registerComponent('PosterImage', PosterImage);
export default PosterImage;
