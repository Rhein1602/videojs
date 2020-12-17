/**
 * @file time-divider.js
 */
import Component from '../../component.js';

/**
 * 当前时间和持续时间之间的分隔符。
 * 如果设计中不需要，可以隐藏。
 *
 * @extends Component
 */
class TimeDivider extends Component {

  /**
   * 创建组件的DOM元素
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-time-control vjs-time-divider',
      innerHTML: '<div><span>/</span></div>'
    }, {
      // 辅助技术人员可以隐藏该元素及其内容，
      //因为它是由当前时间和持续时间显示的控制文本声明而变得无关紧要的
      'aria-hidden': true
    });
  }

}

Component.registerComponent('TimeDivider', TimeDivider);
export default TimeDivider;
