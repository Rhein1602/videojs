/**
 * @file loading-spinner.js
 */
import Component from './component';
import * as dom from './utils/dom';

/**
 * A loading spinner for use during waiting/loading events.
 * 在等待/加载事件期间使用的加载微调器。
 * @extends Component
 */
class LoadingSpinner extends Component {

  /**
   * Create the `LoadingSpinner`s DOM element.
   * 创建“LoadingSpinner”的DOM元素。
   * @return {Element}
   *         The dom element that gets created.
   */
  createEl() {
    const isAudio = this.player_.isAudio();
    const playerType = this.localize(isAudio ? 'Audio Player' : 'Video Player');
    const controlText = dom.createEl('span', {
      className: 'vjs-control-text',
      innerHTML: this.localize('{1} is loading.', [playerType])
    });

    const el = super.createEl('div', {
      className: 'vjs-loading-spinner',
      dir: 'ltr'
    });

    el.appendChild(controlText);

    return el;
  }
}

Component.registerComponent('LoadingSpinner', LoadingSpinner);
export default LoadingSpinner;
