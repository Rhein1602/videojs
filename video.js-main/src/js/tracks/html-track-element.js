/**
 * @file html-track-element.js
 */

import EventTarget from '../event-target';
import TextTrack from '../tracks/text-track';

/**
 * @memberof HTMLTrackElement
 * @typedef {HTMLTrackElement~ReadyState}
 * @enum {number}
 */
const NONE = 0;
const LOADING = 1;
const LOADED = 2;
const ERROR = 3;

/**
 * A single track represented in the DOM.
 * DOM中表示的单个轨道
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#htmltrackelement}
 * @extends EventTarget
 */
class HTMLTrackElement extends EventTarget {

  /**
   * Create an instance of this class.
   *
   * @param {Object} options={}
   *        Object of option names and values
   *         创建此类的实例。
   *
   * @param {Tech} options.tech
   *        A reference to the tech that owns this HTMLTrackElement.
   *         选项名称和值的对象
   *
   * @param {TextTrack~Kind} [options.kind='subtitles']
   *        A valid text track kind.
   *        对拥有此HTMLTrackElement的技术的引用。
   *
   * @param {TextTrack~Mode} [options.mode='disabled']
   *        A valid text track mode.
   *        对拥有此HTMLTrackElement的技术的引用。
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this TextTrack.
   *         此TextTrack的唯一ID。
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *        该曲目的菜单标签。
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *        有效的两个字符的语言代码。
   *
   * @param {string} [options.srclang='']
   *        A valid two character language code. An alternative, but deprioritized
   *        vesion of `options.language`
   *        有效的两个字符的语言代码。 option.language的另一种选择，但不优先使用
   *
   * @param {string} [options.src]
   *        A url to TextTrack cues.
   *        extTrack提示的网址。
   *
   * @param {boolean} [options.default]
   *        If this track should default to on or off.
   *        如果此轨道应默认设置为打开或关闭
   */
  constructor(options = {}) {
    super();

    let readyState;

    const track = new TextTrack(options);

    this.kind = track.kind;
    this.src = track.src;
    this.srclang = track.language;
    this.label = track.label;
    this.default = track.default;

    Object.defineProperties(this, {

      /**
       * @memberof HTMLTrackElement
       * @member {HTMLTrackElement~ReadyState} readyState
       *         The current ready state of the track element.
       *         跟踪元素的当前就绪状态。
       * @instance
       */
      readyState: {
        get() {
          return readyState;
        }
      },

      /**
       * @memberof HTMLTrackElement
       * @member {TextTrack} track
       *         The underlying TextTrack object.
       *         基础的TextTrack对象。
       * @instance
       *
       */
      track: {
        get() {
          return track;
        }
      }
    });

    readyState = NONE;

    /**
     * @listens TextTrack#loadeddata
     * @fires HTMLTrackElement#load
     */
    track.addEventListener('loadeddata', () => {
      readyState = LOADED;

      this.trigger({
        type: 'load',
        target: this
      });
    });
  }
}

HTMLTrackElement.prototype.allowedEvents_ = {
  load: 'load'
};

HTMLTrackElement.NONE = NONE;
HTMLTrackElement.LOADING = LOADING;
HTMLTrackElement.LOADED = LOADED;
HTMLTrackElement.ERROR = ERROR;

export default HTMLTrackElement;
