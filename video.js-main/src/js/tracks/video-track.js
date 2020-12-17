import {VideoTrackKind} from './track-enums';
import Track from './track';
import merge from '../utils/merge-options';

/**
 * A representation of a single `VideoTrack`.
 * 单个“ VideoTrack”的表示形式。
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotrack}
 * @extends Track
 */
class VideoTrack extends Track {

  /**
   * Create an instance of this class.
   * 创建此类的实例。
   *
   * @param {Object} [options={}]
   *        Object of option names and values
   *        选项名称和值的对象
   *
   * @param {string} [options.kind='']
   *        A valid {@link VideoTrack~Kind}
   *        有效的{@link VideoTrack〜Kind}
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
   * @param {boolean} [options.selected]
   *        If this track is the one that is currently playing.
   *        如果该音轨是当前正在播放的音轨。
   */
  constructor(options = {}) {
    const settings = merge(options, {
      kind: VideoTrackKind[options.kind] || ''
    });

    super(settings);

    let selected = false;

    /**
     * @memberof VideoTrack
     * @member {boolean} selected
     *         If this `VideoTrack` is selected or not. When setting this will
     *         fire {@link VideoTrack#selectedchange} if the state of selected changed.
     *         是否选择了此“ VideoTrack”。 设置时，如果所选状态发生更改，则会触发{@link VideoTrack＃selectedchange}。
     * @instance
     *
     * @fires VideoTrack#selectedchange
     */
    Object.defineProperty(this, 'selected', {
      get() {
        return selected;
      },
      set(newSelected) {
        // an invalid or unchanged value
        if (typeof newSelected !== 'boolean' || newSelected === selected) {
          return;
        }
        selected = newSelected;

        /**
         * An event that fires when selected changes on this track. This allows
         * the VideoTrackList that holds this track to act accordingly.
         * 所选曲目在此轨道上更改时将触发的事件。 这样，保存此轨道的VideoTrackList便可以相应地采取行动。
         *
         * > Note: This is not part of the spec! Native tracks will do
         *         this internally without an event.
         * >注意：这不是规范的一部分！ 本机轨道将在内部执行此操作而不会发生任何事件。
         *
         * @event VideoTrack#selectedchange
         * @type {EventTarget~Event}
         */
        this.trigger('selectedchange');
      }
    });

    // if the user sets this track to selected then
    // set selected to that true value otherwise
    // we keep it false
    // 如果用户将此轨道设置为selected，则将selected设置为该true值，否则我们将其保留为false
    if (settings.selected) {
      this.selected = settings.selected;
    }
  }
}

export default VideoTrack;
