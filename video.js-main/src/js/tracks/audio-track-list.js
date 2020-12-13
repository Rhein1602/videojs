/**
 * @file audio-track-list.js
 */
import TrackList from './track-list';

/**
 * Anywhere we call this function we diverge from the spec
 * as we only support one enabled audiotrack at a time
 * 在我们称为此功能的任何地方，我们都与规范有所不同，因为我们一次仅支持一个启用的音轨
 *
 * @param {AudioTrackList} list
 *        list to work on
 *        工作清单
 *
 * @param {AudioTrack} track
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
    // another audio track is enabled, disable it
    list[i].enabled = false;
  }
};

/**
 * The current list of {@link AudioTrack} for a media file.
 * 媒体文件的{@link AudioTrack}的当前列表
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist}
 * @extends TrackList
 *      继承轨道列表
 */
class AudioTrackList extends TrackList {

  /**
   * Create an instance of this class.
   * 创建此类的实例。
   *
   * @param {AudioTrack[]} [tracks=[]]
   *        A list of `AudioTrack` to instantiate the list with.
   *        `AudioTrack`的列表以实例化列表
   */
  constructor(tracks = []) {
    // make sure only 1 track is enabled
    // sorted from last index to first index
    for (let i = tracks.length - 1; i >= 0; i--) {
      if (tracks[i].enabled) {
        disableOthers(tracks, tracks[i]);
        break;
      }
    }

    super(tracks);
    this.changing_ = false;
  }

  /**
   * Add an {@link AudioTrack} to the `AudioTrackList`.
   * 将{@link AudioTrack}添加到“ AudioTrackList”。
   *
   * @param {AudioTrack} track
   *        The AudioTrack to add to the list
   *        要添加到列表的AudioTrack
   *
   * @fires TrackList#addtrack
   */
  addTrack(track) {
    if (track.enabled) {
      disableOthers(this, track);
    }

    super.addTrack(track);
    // native tracks don't have this
    // 本机音轨没有这个
    if (!track.addEventListener) {
      return;
    }

    track.enabledChange_ = () => {
      // when we are disabling other tracks (since we don't support
      // more than one track at a time) we will set changing_
      // to true so that we don't trigger additional change events
      // 当我们禁用其他轨道时（由于我们一次不支持多个轨道），我们将change__设置为true，这样我们就不会触发其他更改事件
      if (this.changing_) {
        return;
      }
      this.changing_ = true;
      disableOthers(this, track);
      this.changing_ = false;
      this.trigger('change');
    };

    /**
     * @listens AudioTrack#enabledchange
     * @fires TrackList#change
     */
    track.addEventListener('enabledchange', track.enabledChange_);
  }

  removeTrack(rtrack) {
    super.removeTrack(rtrack);

    if (rtrack.removeEventListener && rtrack.enabledChange_) {
      rtrack.removeEventListener('enabledchange', rtrack.enabledChange_);
      rtrack.enabledChange_ = null;
    }
  }
}

export default AudioTrackList;
