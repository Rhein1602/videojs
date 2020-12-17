/**
 * @file resize-manager.js
 */
import window from 'global/window';
import { debounce } from './utils/fn.js';
import * as Events from './utils/events.js';
import mergeOptions from './utils/merge-options.js';
import Component from './component.js';

/**
 * A Resize Manager. It is in charge of triggering `playerresize` on the player in the right conditions.
 *调整大小的管理器。它负责在合适的条件下触发playerresize。
 * It'll either create an iframe and use a debounced resize handler on it or use the new {@link https://wicg.github.io/ResizeObserver/|ResizeObserver}.
 *它要么创建一个iframe并在其上使用一个去抖动的调整处理程序，要么使用新的{@linkhttps://wicg.github.io/ResizeObserver/|ResizeObserver}。
*
 * If the ResizeObserver is available natively, it will be used. A polyfill can be passed in as an option.
 * If a `playerresize` event is not needed, the ResizeManager component can be removed from the player, see the example below.
 * @example <caption>How to disable the resize manager</caption>
 * const player = videojs('#vid', {
 *   resizeManager: false
 * });
 *
 * @see {@link https://wicg.github.io/ResizeObserver/|ResizeObserver specification}
 *
 * @extends Component
 */
class ResizeManager extends Component {

  /**
   * Create the ResizeManager.
   *
   * @param {Object} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of ResizeManager options.
   *
   * @param {Object} [options.ResizeObserver]
   *        A polyfill for ResizeObserver can be passed in here.
   *        If this is set to null it will ignore the native ResizeObserver and fall back to the iframe fallback.
   */
  constructor(player, options) {
    let RESIZE_OBSERVER_AVAILABLE = options.ResizeObserver || window.ResizeObserver;

    // 如果传递了'null'，我们要禁用ResizeObserver
    if (options.ResizeObserver === null) {
      RESIZE_OBSERVER_AVAILABLE = false;
    }

    // 仅在ResizeObserver不可用时创建元素
    const options_ = mergeOptions({
      createEl: !RESIZE_OBSERVER_AVAILABLE,
      reportTouchActivity: false
    }, options);

    super(player, options_);

    this.ResizeObserver = options.ResizeObserver || window.ResizeObserver;
    this.loadListener_ = null;
    this.resizeObserver_ = null;
    this.debouncedHandler_ = debounce(() => {
      this.resizeHandler();
    }, 100, false, this);

    if (RESIZE_OBSERVER_AVAILABLE) {
      this.resizeObserver_ = new this.ResizeObserver(this.debouncedHandler_);
      this.resizeObserver_.observe(player.el());

    } else {
      this.loadListener_ = () => {
        if (!this.el_ || !this.el_.contentWindow) {
          return;
        }

        const debouncedHandler_ = this.debouncedHandler_;
        let unloadListener_ = this.unloadListener_ = function() {
          Events.off(this, 'resize', debouncedHandler_);
          Events.off(this, 'unload', unloadListener_);

          unloadListener_ = null;
        };

        // safari和edge可以在resizemanager释放之前卸载iframe
        // we have to dispose of event handlers correctly before that happens
        Events.on(this.el_.contentWindow, 'unload', unloadListener_);
        Events.on(this.el_.contentWindow, 'resize', debouncedHandler_);
      };

      this.one('load', this.loadListener_);
    }
  }

  createEl() {
    return super.createEl('iframe', {
      className: 'vjs-resize-manager',
      tabIndex: -1
    }, {
      'aria-hidden': 'true'
    });
  }

  /**
   * 在iframe上触发resize或通过ResizeObserver观察到resize时调用
   *
   * @fires Player#playerresize
   */
  resizeHandler() {
    /**
     * 当播放器大小改变时调用
     *
     * @event Player#playerresize
     * @type {EventTarget~Event}
     */
    // 确保玩家仍在附近触发
    // prevents this from causing an error after dispose
    if (!this.player_ || !this.player_.trigger) {
      return;
    }

    this.player_.trigger('playerresize');
  }

  dispose() {
    if (this.debouncedHandler_) {
      this.debouncedHandler_.cancel();
    }

    if (this.resizeObserver_) {
      if (this.player_.el()) {
        this.resizeObserver_.unobserve(this.player_.el());
      }
      this.resizeObserver_.disconnect();
    }

    if (this.loadListener_) {
      this.off('load', this.loadListener_);
    }

    if (this.el_ && this.el_.contentWindow && this.unloadListener_) {
      this.unloadListener_.call(this.el_.contentWindow);
    }

    this.ResizeObserver = null;
    this.resizeObserver = null;
    this.debouncedHandler_ = null;
    this.loadListener_ = null;
    super.dispose();
  }

}

Component.registerComponent('ResizeManager', ResizeManager);
export default ResizeManager;
