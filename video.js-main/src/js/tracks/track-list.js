/**
 * @file track-list.js
 */
import EventTarget from '../event-target';
import {isEvented} from '../mixins/evented';

/**
 * Common functionaliy between {@link TextTrackList}, {@link AudioTrackList}, and
 * {@link VideoTrackList}
 * {@link TextTrackList}，{@ link AudioTrackList}和{@link VideoTrackList}之间的通用功能
 *
 * @extends EventTarget
 */
class TrackList extends EventTarget {
  /**
   * Create an instance of this class
   * 创建此类的实例
   *
   * @param {Track[]} tracks
   *        A list of tracks to initialize the list with.
   *        用于初始化列表的轨道列表。
   *
   * @abstract
   */
  constructor(tracks = []) {
    super();

    this.tracks_ = [];

    /**
     * @memberof TrackList
     * @member {number} length
     *         The current number of `Track`s in the this Trackist.
     *         此跟踪清单中当前的跟踪数。
     * @instance
     */
    Object.defineProperty(this, 'length', {
      get() {
        return this.tracks_.length;
      }
    });

    for (let i = 0; i < tracks.length; i++) {
      this.addTrack(tracks[i]);
    }
  }

  /**
   * Add a {@link Track} to the `TrackList`
   * 将{@link Track}添加到`TrackList`
   *
   * @param {Track} track
   *        The audio, video, or text track to add to the list.
   *        要添加到列表中的音频，视频或文本轨道。
   *
   * @fires TrackList#addtrack
   */
  addTrack(track) {
    const index = this.tracks_.length;

    if (!('' + index in this)) {
      Object.defineProperty(this, index, {
        get() {
          return this.tracks_[index];
        }
      });
    }

    // Do not add duplicate tracks
    if (this.tracks_.indexOf(track) === -1) {
      this.tracks_.push(track);
      /**
       * Triggered when a track is added to a track list.
       * 将轨道添加到曲目列表时触发。
       *
       * @event TrackList#addtrack
       * @type {EventTarget~Event}
       * @property {Track} track
       *           A reference to track that was added.
       *           对已添加曲目的引用
       */
      this.trigger({
        track,
        type: 'addtrack',
        target: this
      });
    }

    /**
     * Triggered when a track label is changed.
     * 更改曲目标签时触发。
     *
     * @event TrackList#addtrack
     * @type {EventTarget~Event}
     * @property {Track} track
     *           A reference to track that was added.
     *           对已添加跟踪的引用。
     */
    track.labelchange_ = () => {
      this.trigger({
        track,
        type: 'labelchange',
        target: this
      });
    };

    if (isEvented(track)) {
      track.addEventListener('labelchange', track.labelchange_);
    }
  }

  /**
   * Remove a {@link Track} from the `TrackList`
   * 从“ TrackList”中删除一个{@link Track}
   *
   * @param {Track} rtrack
   *        The audio, video, or text track to remove from the list.
   *        要从列表中删除的音频，视频或文本轨道。
   *
   * @fires TrackList#removetrack
   */
  removeTrack(rtrack) {
    let track;

    for (let i = 0, l = this.length; i < l; i++) {
      if (this[i] === rtrack) {
        track = this[i];
        if (track.off) {
          track.off();
        }

        this.tracks_.splice(i, 1);

        break;
      }
    }

    if (!track) {
      return;
    }

    /**
     * Triggered when a track is removed from track list.
     * 从轨道列表中删除轨道时触发。
     *
     * @event TrackList#removetrack
     * @type {EventTarget~Event}
     * @property {Track} track
     *           A reference to track that was removed.
     *           对已删除轨道的引用。
     */
    this.trigger({
      track,
      type: 'removetrack',
      target: this
    });
  }

  /**
   * Get a Track from the TrackList by a tracks id
   * 通过曲目ID从TrackList获取轨道
   *
   * @param {string} id - the id of the track to get
   * @method getTrackById
   * @return {Track} zzf add
   * @private
   */
  getTrackById(id) {
    let result = null;

    for (let i = 0, l = this.length; i < l; i++) {
      const track = this[i];

      if (track.id === id) {
        result = track;
        break;
      }
    }

    return result;
  }
}

/**
 * Triggered when a different track is selected/enabled.
 * /启用当选择了不同的轨道触发。
 *
 * @event TrackList#change
 * @type {EventTarget~Event}
 */

/**
 * Events that can be called with on + eventName. See {@link EventHandler}.
 * 可以使用on + eventName调用的事件。 请参阅{@link EventHandler}。
 *
 * @property {Object} TrackList#allowedEvents_
 * @private
 */
TrackList.prototype.allowedEvents_ = {
  change: 'change',
  addtrack: 'addtrack',
  removetrack: 'removetrack',
  labelchange: 'labelchange'
};

// emulate attribute EventHandler support to allow for feature detection
for (const event in TrackList.prototype.allowedEvents_) {
  TrackList.prototype['on' + event] = null;
}

export default TrackList;
