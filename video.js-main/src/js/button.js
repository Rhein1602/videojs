/**
 * @file button.js
 */
import ClickableComponent from './clickable-component.js';
import Component from './component';
import log from './utils/log.js';
import {assign} from './utils/obj';
import keycode from 'keycode';

/**
 * Base class for all buttons.
 * 所有按钮的基类。
 * @extends ClickableComponent
 */
class Button extends ClickableComponent {

  /**
   * Create the `Button`s DOM element.
   * 创建`Button`的DOM元素。
   * @param {string} [tag="button"]
   *        The element's node type. This argument is IGNORED: no matter what
   *        is passed, it will always create a `button` element.
   *        元素的节点类型。此参数被忽略：无论传递什么，它都将始终创建一个“button”元素。
   * @param {Object} [props={}]
   *        An object of properties that should be set on the element.
   *        应在元素上设置的属性的对象。
   * @param {Object} [attributes={}]
   *        An object of attributes that should be set on the element.
   *        应在元素上设置的属性的对象。
   * @return {Element}
   *         The element that gets created.
   *          创建的元素。
   */
  createEl(tag, props = {}, attributes = {}) {
    tag = 'button';

    props = assign({
      innerHTML: '<span aria-hidden="true" class="vjs-icon-placeholder"></span>',
      className: this.buildCSSClass()
    }, props);

    // Add attributes for button element
    // 添加按钮元素的属性
    attributes = assign({

      // Necessary since the default button type is "submit"
      // 默认按钮类型为“submit”
      type: 'button'
    }, attributes);

    const el = Component.prototype.createEl.call(this, tag, props, attributes);

    this.createControlTextEl(el);

    return el;
  }

  /**
   * Add a child `Component` inside of this `Button`.
   * 在此“按钮”中添加子“Component”。
   * @param {string|Component} child
   *        The name or instance of a child to add.
   *
   * @param {Object} [options={}]
   *        The key/value store of options that will get passed to children of
   *        the child.
   *
   * @return {Component}
   *         The `Component` that gets added as a child. When using a string the
   *         `Component` will get created by this process.
   *
   * @deprecated since version 5
   */
  addChild(child, options = {}) {
    const className = this.constructor.name;

    log.warn(`Adding an actionable (user controllable) child to a Button (${className}) is not supported; use a ClickableComponent instead.`);

    // Avoid the error message generated by ClickableComponent's addChild method
    // 避免ClickableComponent的addChild方法生成的错误消息
    return Component.prototype.addChild.call(this, child, options);
  }

  /**
   * Enable the `Button` element so that it can be activated or clicked. Use this with
   * {@link Button#disable}.
   * 启用“Button”元素，以便可以激活或单击它。与{@link Button#disable}一起使用。
   * 激活按钮
   * 
   */
  enable() {
    super.enable();
    this.el_.removeAttribute('disabled');
  }

  /**
   * Disable the `Button` element so that it cannot be activated or clicked. Use this with
   * {@link Button#enable}.
   * 禁用“Button”元素，使其无法激活或单击。与{@link Button#enable}一起使用。
   * 失活按钮
   * 
   */
  disable() {
    super.disable();
    this.el_.setAttribute('disabled', 'disabled');
  }

  /**
   * This gets called when a `Button` has focus and `keydown` is triggered via a key
   * press.
   * 当“Button”有焦点，而“keydown”通过按键被触发时，他就会被调用。
   * @param {EventTarget~Event} event
   *        The event that caused this function to get called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {

    // Ignore Space or Enter key operation, which is handled by the browser for
    // a button - though not for its super class, ClickableComponent. Also,
    // prevent the event from propagating through the DOM and triggering Player
    // hotkeys. We do not preventDefault here because we _want_ the browser to
    // handle it.
    // 忽略空格或回车键操作，这是由浏览器处理的按钮-虽然不是它的超级类ClickableComponent。另外，防止事件通过DOM传播并触发播放器热键。
    // 我们不能阻止默认，因为我们希望浏览器处理它。
    if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
      event.stopPropagation();
      return;
    }

    // Pass keypress handling up for unsupported keys
    // 对不支持的按键进行按键处理
    super.handleKeyDown(event);
  }
}

Component.registerComponent('Button', Button);
export default Button;
