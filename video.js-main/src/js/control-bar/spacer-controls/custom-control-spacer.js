/**
 * @file custom-control-spacer.js
 */
import Spacer from './spacer.js';
import Component from '../../component.js';

/**
 * 间隔器专门用来作为新插件的插入点，等等。
 *
 * @extends Spacer
 */
class CustomControlSpacer extends Spacer {

  /**
   * 构建默认的DOM“类名”。
   *
   * @return {string}
   *         此对象的DOM `className ' .
   */
  buildCSSClass() {
    return `vjs-custom-control-spacer ${super.buildCSSClass()}`;
  }

  /**
   * 创建“组件”的DOM元素
   *
   * @return {Element}
   *         创建的元素。
   */
  createEl() {
    const el = super.createEl({
      className: this.buildCSSClass()
    });

    // 无伸缩/表格单元格模式要求单元格中有一些内容来填充表格的剩余空间。
    el.innerHTML = '\u00a0';
    return el;
  }
}

Component.registerComponent('CustomControlSpacer', CustomControlSpacer);
export default CustomControlSpacer;
