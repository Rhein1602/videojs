/**
 * @file video-track-list.js
 */
import TrackList from './track-list';

/**
 * Un-select all other {@link VideoTrack}s that are selected.
 * 取消选择所有其他{@link VideoTrack}。
 *
 * @param {VideoTrackList} list
 *        list to work on
 *        工作清单
 *
 * @param {VideoTrack} track
 *        The track to skip
 *        跳过的轨道
 *
 * @private
 */
const disableOthers = function(list, track) {
  for (let i = 0; i < list.length; i++) {
    if (!Object.keys(list[i]).length || track.id === list[i].id) {
      continue;
    }
    // another video track is enabled, disable it
    list[i].selected = false;
  }
};

/**
 * The current list of {@link VideoTrack} for a video.
 * 视频的{@link VideoTrack}当前列表。
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist}
 * @extends TrackList
 */
class VideoTrackList extends TrackList {

  /**
   * Create an instance of this class.
   * 创建此类的实例。
   *
   * @param {VideoTrack[]} [tracks=[]]
   *        A list of `VideoTrack` to instantiate the list with.
   *        用于实例化列表的`VideoTrack`列表。
   */
  constructor(tracks = []) {
    // make sure only 1 track is enabled
    // sorted from last index to first index
    // 确保仅启用一个轨道，从最后一个索引到第一个索引排序
    for (let i = tracks.length - 1; i >= 0; i--) {
      if (tracks[i].selected) {
        disableOthers(tracks, tracks[i]);
        break;
      }
    }

    super(tracks);
    this.changing_ = false;

    /**
     * @member {number} VideoTrackList#selectedIndex
     *         The current index of the selected {@link VideoTrack`}.
     *         所选{@link VideoTrack`}的当前索引。
     */
    Object.defineProperty(this, 'selectedIndex', {
      get() {
        for (let i = 0; i < this.length; i++) {
          if (this[i].selected) {
            return i;
          }
        }
        return -1;
      },
      set() {}
    });
  }

  /**
   * Add a {@link VideoTrack} to the `VideoTrackList`.
   * 将{@link VideoTrack}添加到“ VideoTrackList”。
   *
   * @param {VideoTrack} track
   *        The VideoTrack to add to the list
   *        要添加到列表中的VideoTrack
   *
   * @fires TrackList#addtrack
   */
  addTrack(track) {
    if (track.selected) {
      disableOthers(this, track);
    }

    super.addTrack(track);
    // native tracks don't have this
    // 本机音轨没有这个
    if (!track.addEventListener) {
      return;
    }

    track.selectedChange_ = () => {
      if (this.changing_) {
        return;
      }
      this.changing_ = true;
      disableOthers(this, track);
      this.changing_ = false;
      this.trigger('change');
    };

    /**
     * @listens VideoTrack#selectedchange
     * @fires TrackList#change
     */
    track.addEventListener('selectedchange', track.selectedChange_);
  }

  removeTrack(rtrack) {
    super.removeTrack(rtrack);

    if (rtrack.removeEventListener && rtrack.selectedChange_) {
      rtrack.removeEventListener('selectedchange', rtrack.selectedChange_);
      rtrack.selectedChange_ = null;
    }
  }
}

export default VideoTrackList;
