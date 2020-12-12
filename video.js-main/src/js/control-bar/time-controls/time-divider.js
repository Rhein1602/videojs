/**
 * @file time-divider.js
 */
import Component from '../../component.js';

/**
 * The separator between the current time and duration.
 * Can be hidden if it's not needed in the design.
 * 当前时间和持续时间之间的分隔符。如果设计中不需要，可以将其隐藏。
 *
 * @extends Component
 */
class TimeDivider extends Component {

  /**
   * Create the component's DOM element
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
      // this element and its contents can be hidden from assistive techs since
      // it is made extraneous by the announcement of the control text
      // for the current time and duration displays
      // 该元素及其内容可以从辅助技术中隐藏起来，因为通过宣布当前时间和持续时间显示的控制文本而使其显得多余
      'aria-hidden': true
    });
  }

}

Component.registerComponent('TimeDivider', TimeDivider);
export default TimeDivider;
