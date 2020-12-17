/**
 * @file spacer.js
 */
import Component from '../../component.js';

/**
 * 只是一个空的间隔元素，可以作为插件的附加点，等等。
 * 必要时也可用于在元素之间创建空间。
 *
 * @extends Component
 */
class Spacer extends Component {

  /**
  * 构建默认的DOM“类名”。
  *
  * @return {string}
  *        此对象的DOM `className ' .
  */
  buildCSSClass() {
    return `vjs-spacer ${super.buildCSSClass()}`;
  }

  /**
   * 创建“组件”的DOM元素
   *
   * @return {Element}
   *        创建的元素。
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildCSSClass()
    });
  }
}

Component.registerComponent('Spacer', Spacer);

export default Spacer;
