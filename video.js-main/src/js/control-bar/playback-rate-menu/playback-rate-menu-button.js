/**
 * @file playback-rate-menu-button.js
 */
import MenuButton from '../../menu/menu-button.js';
import Menu from '../../menu/menu.js';
import PlaybackRateMenuItem from './playback-rate-menu-item.js';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';

/**
 * 用于控制播放速率的组件。
 *
 * @extends MenuButton
 */
class PlaybackRateMenuButton extends MenuButton {

  /**
   * 创建此类的实例。
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);

    this.updateVisibility();
    this.updateLabel();

    this.on(player, 'loadstart', this.updateVisibility);
    this.on(player, 'ratechange', this.updateLabel);
  }

  /**
   * 创建“组件”的DOM元素
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl();

    this.labelEl_ = Dom.createEl('div', {
      className: 'vjs-playback-rate-value',
      innerHTML: '1x'
    });

    el.appendChild(this.labelEl_);

    return el;
  }

  dispose() {
    this.labelEl_ = null;

    super.dispose();
  }

  /**
   * 构建默认的DOM“类名”。
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-playback-rate ${super.buildCSSClass()}`;
  }

  buildWrapperCSSClass() {
    return `vjs-playback-rate ${super.buildWrapperCSSClass()}`;
  }

  /**
   * 创建回放速率菜单
   *
   * @return {Menu}
   *         Menu object populated with {@link PlaybackRateMenuItem}s
   */
  createMenu() {
    const menu = new Menu(this.player());
    const rates = this.playbackRates();

    if (rates) {
      for (let i = rates.length - 1; i >= 0; i--) {
        menu.addChild(new PlaybackRateMenuItem(this.player(), {rate: rates[i] + 'x'}));
      }
    }

    return menu;
  }

  /**
   * 更新ARIA可访问性属性
   */
  updateARIAAttributes() {
    // 当前播放速率
    this.el().setAttribute('aria-valuenow', this.player().playbackRate());
  }

  /**
   * 当“点击”一个“回放速度按钮”时，就会调用这个函数。 See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    // 选择下一个费率选项
    const currentRate = this.player().playbackRate();
    const rates = this.playbackRates();

    // 如果当前选择了最后一个，这将选择第一个
    let newRate = rates[0];

    for (let i = 0; i < rates.length; i++) {
      if (rates[i] > currentRate) {
        newRate = rates[i];
        break;
      }
    }
    this.player().playbackRate(newRate);
  }

  /**
   * 获得可能的播放速率
   *
   * @return {Array}
   *         All possible playback rates
   */
  playbackRates() {
    return this.options_.playbackRates || (this.options_.playerOptions && this.options_.playerOptions.playbackRates);
  }

  /**
   * 获取播放速率是否受技术支持，是否存在播放速率数组
   *
   * @return {boolean}
   *         Whether changing playback rate is supported
   */
  playbackRateSupported() {
    return this.player().tech_ &&
      this.player().tech_.featuresPlaybackRate &&
      this.playbackRates() &&
      this.playbackRates().length > 0
    ;
  }

  /**
   * 当没有回放速率选项可供选择时，隐藏回放速率控制
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#loadstart
   */
  updateVisibility(event) {
    if (this.playbackRateSupported()) {
      this.removeClass('vjs-hidden');
    } else {
      this.addClass('vjs-hidden');
    }
  }

  /**
   * 费率改变时更新按钮标签
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#ratechange
   */
  updateLabel(event) {
    if (this.playbackRateSupported()) {
      this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
    }
  }

}

/**
 * 应显示在“全屏切换”控件上的文本。添加用于本地化。
 *
 * @type {string}
 * @private
 */
PlaybackRateMenuButton.prototype.controlText_ = 'Playback Rate';

Component.registerComponent('PlaybackRateMenuButton', PlaybackRateMenuButton);
export default PlaybackRateMenuButton;
