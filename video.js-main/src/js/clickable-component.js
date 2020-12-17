/**
 * @file clickable-component.js
 */
import Component from './component';
import * as Dom from './utils/dom.js';
import log from './utils/log.js';
import {assign} from './utils/obj';
import keycode from 'keycode';

/**
 * Component which is clickable or keyboard actionable, but is not a
 * native HTML button.
 * 可单击或键盘可操作的组件，但不是本机HTML按钮。
 * @extends Component
 */
class ClickableComponent extends Component {

  /**
   * Creates an instance of this class.
   * 创建此类的实例。
   * @param  {Player} player
   *         The `Player` that this class should be attached to.
   *          这个类应该附加到的“Player”。
   * @param  {Object} [options]
   *         The key/value store of player options.
   *        player选项的键值对。
   * @param  {function} [options.clickHandler]
   *         The function to call when the button is clicked / activated
   *         单击/激活按钮时要调用的函数
   */
  constructor(player, options) {
    super(player, options);

    this.emitTapEvents();

    this.enable();
  }

  /**
   * Create the `ClickableComponent`s DOM element.
   * 创建“ClickableComponent”的DOM元素。
   * @param {string} [tag=div]
   *        The element's node type.
   *
   * @param {Object} [props={}]
   *        An object of properties that should be set on the element.
   *
   * @param {Object} [attributes={}]
   *        An object of attributes that should be set on the element.
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl(tag = 'div', props = {}, attributes = {}) {
    props = assign({
      innerHTML: '<span aria-hidden="true" class="vjs-icon-placeholder"></span>',
      className: this.buildCSSClass(),
      tabIndex: 0
    }, props);

    if (tag === 'button') {
      log.error(`Creating a ClickableComponent with an HTML element of ${tag} is not supported; use a Button instead.`);
    }

    // Add ARIA attributes for clickable element which is not a native HTML button
    // 为不是本机HTML按钮的可单击元素添加ARIA属性
    attributes = assign({
      role: 'button'
    }, attributes);

    this.tabIndex_ = props.tabIndex;

    const el = super.createEl(tag, props, attributes);

    this.createControlTextEl(el);

    return el;
  }

  dispose() {
    // remove controlTextEl_ on dispose
    // 处理时移除controlTextEl
    this.controlTextEl_ = null;

    super.dispose();
  }

  /**
   * Create a control text element on this `ClickableComponent`
   * 在此`ClickableComponent上创建控件文本元素`
   * @param {Element} [el]
   *        Parent element for the control text.
   *
   * @return {Element}
   *         The control text element that gets created.
   */
  createControlTextEl(el) {
    this.controlTextEl_ = Dom.createEl('span', {
      className: 'vjs-control-text'
    }, {
      // let the screen reader user know that the text of the element may change
      // 让屏幕阅读器用户知道元素的文本可能会更改
      'aria-live': 'polite'
    });

    if (el) {
      el.appendChild(this.controlTextEl_);
    }

    this.controlText(this.controlText_, el);

    return this.controlTextEl_;
  }

  /**
   * Get or set the localize text to use for the controls on the `ClickableComponent`.
   * 获取或设置用于“ClickableComponent”上的控件的本地化文本。
   * @param {string} [text]
   *        Control text for element.
   *
   * @param {Element} [el=this.el()]
   *        Element to set the title on.
   *
   * @return {string}
   *         - The control text when getting
   */
  controlText(text, el = this.el()) {
    if (text === undefined) {
      return this.controlText_ || 'Need Text';
    }

    const localizedText = this.localize(text);

    this.controlText_ = text;
    Dom.textContent(this.controlTextEl_, localizedText);
    if (!this.nonIconControl) {
      // Set title attribute if only an icon is shown
      // 仅显示图标时设置标题属性
      el.setAttribute('title', localizedText);
    }
  }

  /**
   * Builds the default DOM `className`.
   * 生成默认的DOM“className”。
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-control vjs-button ${super.buildCSSClass()}`;
  }

  /**
   * Enable this `ClickableComponent`
   * 启用此`ClickableComponent`
   */
  enable() {
    if (!this.enabled_) {
      this.enabled_ = true;
      this.removeClass('vjs-disabled');
      this.el_.setAttribute('aria-disabled', 'false');
      if (typeof this.tabIndex_ !== 'undefined') {
        this.el_.setAttribute('tabIndex', this.tabIndex_);
      }
      this.on(['tap', 'click'], this.handleClick);
      this.on('keydown', this.handleKeyDown);
    }
  }

  /**
   * Disable this `ClickableComponent`
   * 禁用此`ClickableComponent`
   */
  disable() {
    this.enabled_ = false;
    this.addClass('vjs-disabled');
    this.el_.setAttribute('aria-disabled', 'true');
    if (typeof this.tabIndex_ !== 'undefined') {
      this.el_.removeAttribute('tabIndex');
    }
    this.off('mouseover', this.handleMouseOver);
    this.off('mouseout', this.handleMouseOut);
    this.off(['tap', 'click'], this.handleClick);
    this.off('keydown', this.handleKeyDown);
  }

  /**
   * Handles language change in ClickableComponent for the player in components
   * 在组件中为播放器处理ClickableComponent中的语言更改
   *
   */
  handleLanguagechange() {
    this.controlText(this.controlText_);
  }

  /**
   * Event handler that is called when a `ClickableComponent` receives a
   * `click` or `tap` event.
   * 当“ClickableComponent”接收到“click”或“tap”事件时调用的事件处理程序。
   * @param {EventTarget~Event} event
   *        The `tap` or `click` event that caused this function to be called.
   *
   * @listens tap
   * @listens click
   * @abstract
   */
  handleClick(event) {
    if (this.options_.clickHandler) {
      this.options_.clickHandler.call(this, arguments);
    }
  }

  /**
   * Event handler that is called when a `ClickableComponent` receives a
   * `keydown` event.
   * 当“ClickableComponent”接收到“keydown”事件时调用的事件处理程序。
   * By default, if the key is Space or Enter, it will trigger a `click` event.
   * 默认情况下，如果键是Space或Enter，它将触发一个“click”事件。
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {

    // Support Space or Enter key operation to fire a click event. Also,
    // prevent the event from propagating through the DOM and triggering
    // 支持空格键或Enter键操作来触发单击事件。另外，防止事件通过DOM传播并触发
    // Player hotkeys.
    if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
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

Component.registerComponent('ClickableComponent', ClickableComponent);
export default ClickableComponent;
