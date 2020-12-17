/**
 * @file close-button.js
 */
import Button from './button';
import Component from './component';
import keycode from 'keycode';

/**
 * The `CloseButton` is a `{@link Button}` that fires a `close` event when
 * it gets clicked.
 * “CloseButton”是一个{@link Button}'，当单击它时，它会触发一个“close”事件。
 * @extends Button
 */
class CloseButton extends Button {

  /**
  * Creates an instance of the this class.
  * 创建此类的实例。
  * @param  {Player} player
  *         The `Player` that this class should be attached to.
  *
  * @param  {Object} [options]
  *         The key/value store of player options.
  */
  constructor(player, options) {
    super(player, options);
    this.controlText(options && options.controlText || this.localize('Close'));
  }

  /**
  * Builds the default DOM `className`.
  * 生成默认的DOM“className”。
  * @return {string}
  *         The DOM `className` for this object.
  */
  buildCSSClass() {
    return `vjs-close-button ${super.buildCSSClass()}`;
  }

  /**
   * This gets called when a `CloseButton` gets clicked. See
   * {@link ClickableComponent#handleClick} for more information on when
   * this will be triggered
   * 当单击“CloseButton”时调用此函数。有关何时触发的详细信息，
   * 请参见{@link ClickableComponent#handleClick}
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   * @fires CloseButton#close
   */
  handleClick(event) {

    /**
     * Triggered when the a `CloseButton` is clicked.
     * 单击“CloseButton”时触发。
     * @event CloseButton#close
     * @type {EventTarget~Event}
     *
     * @property {boolean} [bubbles=false]
     *           set to false so that the close event does not
     *           bubble up to parents if there is no listener
     */
    this.trigger({type: 'close', bubbles: false});
  }
  /**
   * Event handler that is called when a `CloseButton` receives a
   * `keydown` event.
   * 当“CloseButton”接收到“keydown”事件时调用的事件处理程序。
   * By default, if the key is Esc, it will trigger a `click` event.
   * 默认情况下，如果键是Esc，它将触发一个“click”事件。
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {
    // Esc button will trigger `click` event
    // Esc按钮将触发“click”事件
    if (keycode.isEventKey(event, 'Esc')) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger('click');
    } else {
      // Pass keypress handling up for unsupported keys
      // 对不支持的按键进行按键处理
      super.handleKeyDown(event);
    }
  }
}

Component.registerComponent('CloseButton', CloseButton);
export default CloseButton;
