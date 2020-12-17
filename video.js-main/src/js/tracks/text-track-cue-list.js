/**
 * @file text-track-cue-list.js
 */

/**
 * @typedef {Object} TextTrackCueList~TextTrackCue
 *
 * @property {string} id
 *           The unique id for this text track cue
 *           此文本跟踪提示的唯一ID
 *
 * @property {number} startTime
 *           The start time for this text track cue
 *           此文本跟踪提示的开始时间
 *
 * @property {number} endTime
 *           The end time for this text track cue
 *           此文本跟踪提示的结束时间
 *
 * @property {boolean} pauseOnExit
   *           Pause when the end time is reached if true.
 *           如果为true，则在达到结束时间时暂停。
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcue}
 */

/**
 * A List of TextTrackCues.
 * TextTrackCues的列表。
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist}
 */
class TextTrackCueList {

  /**
   * Create an instance of this class..
   * 创建此类的实例
   *
   * @param {Array} cues
   *        A list of cues to be initialized with
   *        要初始化的提示列表
   */
  constructor(cues) {
    TextTrackCueList.prototype.setCues_.call(this, cues);

    /**
     * @memberof TextTrackCueList
     * @member {number} length
     *         The current number of `TextTrackCue`s in the TextTrackCueList.
     *         TextTrackCueList中“ TextTrackCue”的当前数量。
     * @instance
     */
    Object.defineProperty(this, 'length', {
      get() {
        return this.length_;
      }
    });
  }

  /**
   * A setter for cues in this list. Creates getters
   * an an index for the cues.
   * 此列表中线索的设置器。 创建吸气剂和提示的索引。
   *
   * @param {Array} cues
   *        An array of cues to set
   *        要设置的提示数组
   *
   * @private
   */
  setCues_(cues) {
    const oldLength = this.length || 0;
    let i = 0;
    const l = cues.length;

    this.cues_ = cues;
    this.length_ = cues.length;

    const defineProp = function(index) {
      if (!('' + index in this)) {
        Object.defineProperty(this, '' + index, {
          get() {
            return this.cues_[index];
          }
        });
      }
    };

    if (oldLength < l) {
      i = oldLength;

      for (; i < l; i++) {
        defineProp.call(this, i);
      }
    }
  }

  /**
     * Get a `TextTrackCue` that is currently in the `TextTrackCueList` by id.
   * 通过id获取当前在“ TextTrackCueList”中的“ TextTrackCue”。
   *
   * @param {string} id
   *        The id of the cue that should be searched for.
   *        应该搜索的提示的ID。
   *
   * @return {TextTrackCueList~TextTrackCue|null}
   *         A single cue or null if none was found.
   *         单个提示；如果未找到，则返回null。
   */
  getCueById(id) {
    let result = null;

    for (let i = 0, l = this.length; i < l; i++) {
      const cue = this[i];

      if (cue.id === id) {
        result = cue;
        break;
      }
    }

    return result;
  }
}

export default TextTrackCueList;
