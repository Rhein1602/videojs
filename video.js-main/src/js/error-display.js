/**
 * @file error-display.js
 */
import Component from './component';
import ModalDialog from './modal-dialog';

/**
 * A display that indicates an error has occurred. This means that the video
 * is unplayable.
 * 指示发生错误的显示。这意味着视频无法播放。
 * @extends ModalDialog
 */
class ErrorDisplay extends ModalDialog {

  /**
   * Creates an instance of this class.
   * 创建此类的实例。
   * @param  {Player} player
   *         The `Player` that this class should be attached to.
   *
   * @param  {Object} [options]
   *         The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.on(player, 'error', this.open);
  }

  /**
   * Builds the default DOM `className`.
   * 生成默认的DOM“className”。
   * @return {string}
   *         The DOM `className` for this object.
   *
   * @deprecated Since version 5.
   */
  buildCSSClass() {
    return `vjs-error-display ${super.buildCSSClass()}`;
  }

  /**
   * Gets the localized error message based on the `Player`s error.
   * 获取基于“Player”错误的本地化错误消息。
   * @return {string}
   *         The `Player`s error message localized or an empty string.
   */
  content() {
    const error = this.player().error();

    return error ? this.localize(error.message) : '';
  }
}

/**
 * The default options for an `ErrorDisplay`.
 * “ErrorDisplay”的默认选项。
 * @private
 */
ErrorDisplay.prototype.options_ = Object.assign({}, ModalDialog.prototype.options_, {
  pauseOnOpen: false,
  fillAlways: true,
  temporary: false,
  uncloseable: true
});

Component.registerComponent('ErrorDisplay', ErrorDisplay);
export default ErrorDisplay;
