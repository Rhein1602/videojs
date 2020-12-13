import {AudioTrackKind} from './track-enums';
import Track from './track';
import merge from '../utils/merge-options';

/**
 * A representation of a single `AudioTrack`. If it is part of an {@link AudioTrackList}
 * only one `AudioTrack` in the list will be enabled at a time.
 * 单个AudioTrack的表示形式。 如果它是“AudioTrackList”的某一部分,列表中一次仅启用一个“ AudioTrack”
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack}
 * @extends Track
 */
class AudioTrack extends Track {

  /**
   * Create an instance of this class.
   * 创建实例
   * @param {Object} [options={}]
   *        Object of option names and values
   *        列表中一次仅启用一个“ AudioTrack”
   *
   * @param {AudioTrack~Kind} [options.kind='']
   *        A valid audio track kind
   *        有效的音轨种类
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this AudioTrack.
   *        此AudioTrack的唯一ID。
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *        该曲目的菜单标签
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *        有效的两个字符的语言代码
   *
   * @param {boolean} [options.enabled]
   *        If this track is the one that is currently playing. If this track is part of
   *        an {@link AudioTrackList}, only one {@link AudioTrack} will be enabled.
   *        如果该音轨是当前正在播放的音轨。 如果这首曲目是"AudioTrackList"的一部分，有且仅有一个音轨有效
   */
  constructor(options = {}) {
    const settings = merge(options, {
      kind: AudioTrackKind[options.kind] || ''
    });

    super(settings);

    let enabled = false;

    /**
     * @memberof AudioTrack
     * @member {boolean} enabled
     *         If this `AudioTrack` is enabled or not. When setting this will
     *         fire {@link AudioTrack#enabledchange} if the state of enabled is changed.
     *         是否启用了“ AudioTrack”。 设置时将触发，如果启用状态已更改
     *
     * @instance
     *
     * @fires VideoTrack#selectedchange
     */
    Object.defineProperty(this, 'enabled', {
      get() {
        return enabled;
      },
      set(newEnabled) {
        // an invalid or unchanged value
        if (typeof newEnabled !== 'boolean' || newEnabled === enabled) {
          return;
        }
        enabled = newEnabled;

        /**
         * An event that fires when enabled changes on this track. This allows
         * the AudioTrackList that holds this track to act accordingly.
         * 当启用此轨道上的更改时将触发的事件。 这允许保留此音轨以执行相应操作的AudioTrackList。
         *
         * > Note: This is not part of the spec! Native tracks will do
         *         this internally without an event.
         *   注意：这不是规范的一部分！ 本机曲目会做内部没有事件。
         *
         * @event AudioTrack#enabledchange
         * @type {EventTarget~Event}
         */
        this.trigger('enabledchange');
      }
    });

    // if the user sets this track to selected then
    // set selected to that true value otherwise
    // we keep it false
    //如果用户将此轨道设置为selected，则将selected设置为该true值，否则我们将其保留为false
    if (settings.enabled) {
      this.enabled = settings.enabled;
    }
    this.loaded_ = true;
  }
}

export default AudioTrack;
