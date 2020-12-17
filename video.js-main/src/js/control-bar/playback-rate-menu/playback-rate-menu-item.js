/**
 * @file playback-rate-menu-item.js
 */
import MenuItem from '../../menu/menu-item.js';
import Component from '../../component.js';

/**
 * 用于选择回放速率的特定菜单项类型。
 *
 * @extends MenuItem
 */
class PlaybackRateMenuItem extends MenuItem {

  /**
   * 创建此类的实例。
   *
   * @param {Player} player
   *        该类应附加到的“玩家”。
   *
   * @param {Object} [options]
   *        玩家选项的键/值存储。
   */
  constructor(player, options) {
    const label = options.rate;
    const rate = parseFloat(label, 10);

    // 修改父MenuItem类的初始化选项。
    options.label = label;
    options.selected = rate === 1;
    options.selectable = true;
    options.multiSelectable = false;

    super(player, options);

    this.label = label;
    this.rate = rate;

    this.on(player, 'ratechange', this.update);
  }

  /**
   * 当“点击”一个“PlaybackRateMenuItem”时，就会调用这个函数。See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        导致此函数被调用的“按键”、“点击”或“点击”事件。
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    super.handleClick();
    this.player().playbackRate(this.rate);
  }

  /**
   * 当播放包速率改变时，更新播放包速率菜单项。
   *
   * @param {EventTarget~Event} [event]
   *        导致此函数运行的“ratechange”事件。
   *
   * @listens Player#ratechange
   */
  update(event) {
    this.selected(this.player().playbackRate() === this.rate);
  }

}

/**
 * 应显示在“PlaybackRateMenuItem”控件上的文本。添加用于本地化
 *
 * @type {string}
 * @private
 */
PlaybackRateMenuItem.prototype.contentElType = 'button';

Component.registerComponent('PlaybackRateMenuItem', PlaybackRateMenuItem);
export default PlaybackRateMenuItem;
