/**
 * @file modal-dialog.js
 */
import * as Dom from './utils/dom';
import Component from './component';
import window from 'global/window';
import document from 'global/document';
import keycode from 'keycode';

const MODAL_CLASS_NAME = 'vjs-modal-dialog';

/**
 * “ModalDialog”会显示在视频及其控件上，这会阻止与播放器的交互，直到关闭。
 *
 * 模式对话框包括一个“关闭”按钮，当该按钮被激活时，或者在任何地方按ESC时都将关闭。
 *
 * @extends Component
 */
class ModalDialog extends Component {

  /**
   *创建此类的实例。
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Mixed} [options.content=undefined]
   *        Provide customized content for this modal.
   *
   * @param {string} [options.description]
   *        A text description for the modal, primarily for accessibility.
   *
   * @param {boolean} [options.fillAlways=false]
   *        Normally, modals are automatically filled only the first time
   *        they open. This tells the modal to refresh its content
   *        every time it opens.
   *
   * @param {string} [options.label]
   *        A text label for the modal, primarily for accessibility.
   *
   * @param {boolean} [options.pauseOnOpen=true]
   *        If `true`, playback will will be paused if playing when
   *        the modal opens, and resumed when it closes.
   *
   * @param {boolean} [options.temporary=true]
   *        If `true`, the modal can only be opened once; it will be
   *        disposed as soon as it's closed.
   *
   * @param {boolean} [options.uncloseable=false]
   *        If `true`, the user will not be able to close the modal
   *        through the UI in the normal ways. Programmatic closing is
   *        still possible.
   */
  constructor(player, options) {
    super(player, options);
    this.opened_ = this.hasBeenOpened_ = this.hasBeenFilled_ = false;

    this.closeable(!this.options_.uncloseable);
    this.content(this.options_.content);

    // 确保在初始化任何子级之后定义contentEl
    // 因为我们只需要contentEl中模态的内容
    // (not the UI elements like the close button).
    this.contentEl_ = Dom.createEl('div', {
      className: `${MODAL_CLASS_NAME}-content`
    }, {
      role: 'document'
    });

    this.descEl_ = Dom.createEl('p', {
      className: `${MODAL_CLASS_NAME}-description vjs-control-text`,
      id: this.el().getAttribute('aria-describedby')
    });

    Dom.textContent(this.descEl_, this.description());
    this.el_.appendChild(this.descEl_);
    this.el_.appendChild(this.contentEl_);
  }

  /**
   * 创建“ModalDialog”的DOM元素
   *
   * @return {Element}
   *         The DOM element that gets created.
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildCSSClass(),
      tabIndex: -1
    }, {
      'aria-describedby': `${this.id()}_description`,
      'aria-hidden': 'true',
      'aria-label': this.label(),
      'role': 'dialog'
    });
  }

  dispose() {
    this.contentEl_ = null;
    this.descEl_ = null;
    this.previouslyActiveEl_ = null;

    super.dispose();
  }

  /**
   * 生成默认的DOM“className”。
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `${MODAL_CLASS_NAME} vjs-hidden ${super.buildCSSClass()}`;
  }

  /**
   * 返回此模式的标签字符串。主要用于无障碍。
   *
   * @return {string}
   *         the localized or raw label of this modal.
   */
  label() {
    return this.localize(this.options_.label || 'Modal Window');
  }

  /**
   * 返回此模式的描述字符串。主要用于无障碍。
   *
   * @return {string}
   *         The localized or raw description of this modal.
   */
  description() {
    let desc = this.options_.description || this.localize('This is a modal window.');

    // 如果模态是可关闭的，则附加一个通用的可关闭性消息。
    if (this.closeable()) {
      desc += ' ' + this.localize('This modal can be closed by pressing the Escape key or activating the close button.');
    }

    return desc;
  }

  /**
   * Opens the modal.
   *
   * @fires ModalDialog#beforemodalopen
   * @fires ModalDialog#modalopen
   */
  open() {
    if (!this.opened_) {
      const player = this.player();

      /**
        * 在打开“ModalDialog”之前激发。
        *
        * @event ModalDialog#beforemodalopen
        * @type {EventTarget~Event}
        */
      this.trigger('beforemodalopen');
      this.opened_ = true;

      // 如果模式以前从未打开过，则填充内容从未被填满过。
      if (this.options_.fillAlways || !this.hasBeenOpened_ && !this.hasBeenFilled_) {
        this.fill();
      }

      // 如果播放机正在播放，请暂停播放并记录其以前的播放状态.
      this.wasPlaying_ = !player.paused();

      if (this.options_.pauseOnOpen && this.wasPlaying_) {
        player.pause();
      }

      this.on('keydown', this.handleKeyDown);

      // 隐藏控件并注意它们是否已启用。
      this.hadControls_ = player.controls();
      player.controls(false);

      this.show();
      this.conditionalFocus_();
      this.el().setAttribute('aria-hidden', 'false');

      /**
        * 在打开“ModalDialog”后立即激发。
        *
        * @event ModalDialog#modalopen
        * @type {EventTarget~Event}
        */
      this.trigger('modalopen');
      this.hasBeenOpened_ = true;
    }
  }

  /**
   * 如果“ModalDialog”当前处于打开或关闭状态。
   *
   * @param  {boolean} [value]
   *         If given, it will open (`true`) or close (`false`) the modal.
   *
   * @return {boolean}
   *         the current open state of the modaldialog
   */
  opened(value) {
    if (typeof value === 'boolean') {
      this[value ? 'open' : 'close']();
    }
    return this.opened_;
  }

  /**
   * 关闭模式，如果“ModalDialog”为未打开.
   *
   * @fires ModalDialog#beforemodalclose
   * @fires ModalDialog#modalclose
   */
  close() {
    if (!this.opened_) {
      return;
    }
    const player = this.player();

    /**
      * 在“ModalDialog”关闭之前激发。
      *
      * @event ModalDialog#beforemodalclose
      * @type {EventTarget~Event}
      */
    this.trigger('beforemodalclose');
    this.opened_ = false;

    if (this.wasPlaying_ && this.options_.pauseOnOpen) {
      player.play();
    }

    this.off('keydown', this.handleKeyDown);

    if (this.hadControls_) {
      player.controls(true);
    }

    this.hide();
    this.el().setAttribute('aria-hidden', 'true');

    /**
      * 在“ModalDialog”关闭后立即激发。
      *
      * @event ModalDialog#modalclose
      * @type {EventTarget~Event}
      */
    this.trigger('modalclose');
    this.conditionalBlur_();

    if (this.options_.temporary) {
      this.dispose();
    }
  }

  /**
   * 检查“ModalDialog”是否可以通过UI关闭。
   *
   * @param  {boolean} [value]
   *         If given as a boolean, it will set the `closeable` option.
   *
   * @return {boolean}
   *         Returns the final value of the closable option.
   */
  closeable(value) {
    if (typeof value === 'boolean') {
      const closeable = this.closeable_ = !!value;
      let close = this.getChild('closeButton');

      // 如果这是关闭，没有关闭按钮，添加一个.
      if (closeable && !close) {

        // 关闭按钮应该是模态的子级，而不是它的子级内容元素，因此临时更改内容元素。
        const temp = this.contentEl_;

        this.contentEl_ = this.el_;
        close = this.addChild('closeButton', {controlText: 'Close Modal Dialog'});
        this.contentEl_ = temp;
        this.on(close, 'close', this.close);
      }

      // 如果这是不可关闭的，并有一个关闭按钮，删除它。
      if (!closeable && close) {
        this.off(close, 'close', this.close);
        this.removeChild(close);
        close.dispose();
      }
    }
    return this.closeable_;
  }

  /**
   * 用modal的“content”选项填充modal的content元素。
   * 在发生此更改之前，内容元素将被清空。
   */
  fill() {
    this.fillWith(this.content());
  }

  /**
   * 用任意内容填充modal的content元素。
   * 在发生此更改之前，内容元素将被清空。
   *
   * @fires ModalDialog#beforemodalfill
   * @fires ModalDialog#modalfill
   *
   * @param {Mixed} [content]
   *        The same rules apply to this as apply to the `content` option.
   */
  fillWith(content) {
    const contentEl = this.contentEl();
    const parentEl = contentEl.parentNode;
    const nextSiblingEl = contentEl.nextSibling;

    /**
      * 在“ModalDialog”充满内容之前激发。
      *
      * @event ModalDialog#beforemodalfill
      * @type {EventTarget~Event}
      */
    this.trigger('beforemodalfill');
    this.hasBeenFilled_ = true;

    // 在执行之前，从DOM中分离content元素
    // manipulation to avoid modifying the live DOM multiple times.
    parentEl.removeChild(contentEl);
    this.empty();
    Dom.insertContent(contentEl, content);
    /**
     * 在“ModalDialog”充满内容后激发.
     *
     * @event ModalDialog#modalfill
     * @type {EventTarget~Event}
     */
    this.trigger('modalfill');

    // 重新注入重新填充的内容元素。
    if (nextSiblingEl) {
      parentEl.insertBefore(contentEl, nextSiblingEl);
    } else {
      parentEl.appendChild(contentEl);
    }

    //确保close按钮是对话框DOM中的最后一个
    const closeButton = this.getChild('closeButton');

    if (closeButton) {
      parentEl.appendChild(closeButton.el_);
    }
  }

  /**
   *清空内容元素。这种情况在任何时候都会发生。
   *
   * @fires ModalDialog#beforemodalempty
   * @fires ModalDialog#modalempty
   */
  empty() {
    /**
    * 在清空“ModalDialog”之前激发.
    *
    * @event ModalDialog#beforemodalempty
    * @type {EventTarget~Event}
    */
    this.trigger('beforemodalempty');
    Dom.emptyEl(this.contentEl());

    /**
    * 在“ModalDialog”清空后立即激发。
    *
    * @event ModalDialog#modalempty
    * @type {EventTarget~Event}
    */
    this.trigger('modalempty');
  }

  /**
   * 在获取规范化内容之前呈现到DOM中。
   *
   * This does not update the DOM or fill the modal, but it is called during
   * that process.
   *
   * @param  {Mixed} [value]
   *         If defined, sets the internal content value to be used on the
   *         next call(s) to `fill`. This value is normalized before being
   *         inserted. To "clear" the internal content value, pass `null`.
   *
   * @return {Mixed}
   *         The current content of the modal dialog
   */
  content(value) {
    if (typeof value !== 'undefined') {
      this.content_ = value;
    }
    return this.content_;
  }

  /**
   * 如果焦点以前在播放器上，则有条件地聚焦模态对话框。 
   *
   * @private
   */
  conditionalFocus_() {
    const activeEl = document.activeElement;
    const playerEl = this.player_.el_;

    this.previouslyActiveEl_ = null;

    if (playerEl.contains(activeEl) || playerEl === activeEl) {
      this.previouslyActiveEl_ = activeEl;

      this.focus();
    }
  }

  /**
   * 有条件地模糊元素并重新聚焦最后一个聚焦元素
   *
   * @private
   */
  conditionalBlur_() {
    if (this.previouslyActiveEl_) {
      this.previouslyActiveEl_.focus();
      this.previouslyActiveEl_ = null;
    }
  }

  /**
   * 键控处理程序。当情态聚焦时。
   *@param {Event} event
   *      zzf add
   * @listens keydown
   */
  handleKeyDown(event) {

    // 不要让按键从模式对话框中伸出。
    event.stopPropagation();

    if (keycode.isEventKey(event, 'Escape') && this.closeable()) {
      event.preventDefault();
      this.close();
      return;
    }

    // 如果不是tab键，请提前退出
    if (!keycode.isEventKey(event, 'Tab')) {
      return;
    }

    const focusableEls = this.focusableEls_();
    const activeEl = this.el_.querySelector(':focus');
    let focusIndex;

    for (let i = 0; i < focusableEls.length; i++) {
      if (activeEl === focusableEls[i]) {
        focusIndex = i;
        break;
      }
    }

    if (document.activeElement === this.el_) {
      focusIndex = 0;
    }

    if (event.shiftKey && focusIndex === 0) {
      focusableEls[focusableEls.length - 1].focus();
      event.preventDefault();
    } else if (!event.shiftKey && focusIndex === focusableEls.length - 1) {
      focusableEls[0].focus();
      event.preventDefault();
    }
  }

  /**
   * 获取所有可聚焦元素
   *  @return {Array}
   *      zzf add
   * @private
   */
  focusableEls_() {
    const allChildren = this.el_.querySelectorAll('*');

    return Array.prototype.filter.call(allChildren, (child) => {
      return ((child instanceof window.HTMLAnchorElement ||
               child instanceof window.HTMLAreaElement) && child.hasAttribute('href')) ||
             ((child instanceof window.HTMLInputElement ||
               child instanceof window.HTMLSelectElement ||
               child instanceof window.HTMLTextAreaElement ||
               child instanceof window.HTMLButtonElement) && !child.hasAttribute('disabled')) ||
             (child instanceof window.HTMLIFrameElement ||
               child instanceof window.HTMLObjectElement ||
               child instanceof window.HTMLEmbedElement) ||
             (child.hasAttribute('tabindex') && child.getAttribute('tabindex') !== -1) ||
             (child.hasAttribute('contenteditable'));
    });
  }
}

/**
 * `ModalDialog`Default options的默认选项。
 *
 * @type {Object}
 * @private
 */
ModalDialog.prototype.options_ = {
  pauseOnOpen: true,
  temporary: true
};

Component.registerComponent('ModalDialog', ModalDialog);
export default ModalDialog;
