/**
 * @file track.js
 */
import * as Guid from '../utils/guid.js';
import EventTarget from '../event-target';

/**
 * A Track class that contains all of the common functionality for {@link AudioTrack},
 * {@link VideoTrack}, and {@link TextTrack}.
 * 一个Track类，其中包含{@link AudioTrack}，{@ link VideoTrack}和{@link TextTrack}的所有常用功能。
 *
 * > Note: This class should not be used directly
 * >注意：此类不应直接使用
 *
 * @see {@link https://html.spec.whatwg.org/multipage/embedded-content.html}
 * @extends EventTarget
 * @abstract
 */
class Track extends EventTarget {

  /**
   * Create an instance of this class.
   * 创建此类的实例。
   *
   * @param {Object} [options={}]
   *        Object of option names and values
   *        选项名称和值的对象
   *
   * @param {string} [options.kind='']
   *        A valid kind for the track type you are creating.
   *        您要创建的曲目类型的有效类型。
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this AudioTrack.
   *        此AudioTrack的唯一ID。
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *        该曲目的菜单标签。
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *        有效的两个字符的语言代码。
   *
   * @abstract
   */
  constructor(options = {}) {
    super();

    const trackProps = {
      id: options.id || 'vjs_track_' + Guid.newGUID(),
      kind: options.kind || '',
      language: options.language || ''
    };

    let label = options.label || '';

    /**
     * @memberof Track
     * @member {string} id
     *         The id of this track. Cannot be changed after creation.
     *         该轨道的ID。 创建后无法更改。
     * @instance
     *
     * @readonly
     */

    /**
     * @memberof Track
     * @member {string} kind
     *         The kind of track that this is. Cannot be changed after creation.
     *         这是一种轨道。 创建后无法更改。
     * @instance
     *
     * @readonly
     */

    /**
     * @memberof Track
     * @member {string} language
     *         The two letter language code for this track. Cannot be changed after
     *         creation.
     *         此音轨的两个字母的语言代码。 创建后无法更改。
     * @instance
     *
     * @readonly
     */

    for (const key in trackProps) {
      Object.defineProperty(this, key, {
        get() {
          return trackProps[key];
        },
        set() {}
      });
    }

    /**
     * @memberof Track
     * @member {string} label
     *         The label of this track. Cannot be changed after creation.
     *         该音轨的标签。 创建后无法更改。
     * @instance
     *
     * @fires Track#labelchange
     */
    Object.defineProperty(this, 'label', {
      get() {
        return label;
      },
      set(newLabel) {
        if (newLabel !== label) {
          label = newLabel;

          /**
           * An event that fires when label changes on this track.
           * 标签在此轨道上更改时触发的事件。
           *
           * > Note: This is not part of the spec!\
           * >注意：这不是规范的一部分！
           *
           * @event Track#labelchange
           * @type {EventTarget~Event}
           */
          this.trigger('labelchange');
        }
      }
    });
  }
}

export default Track;
