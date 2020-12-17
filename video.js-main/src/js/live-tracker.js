import Component from './component.js';
import mergeOptions from './utils/merge-options.js';
import document from 'global/document';
import * as browser from './utils/browser.js';
import window from 'global/window';
import * as Fn from './utils/fn.js';

const defaults = {
  trackingThreshold: 30,
  liveTolerance: 15
};

/*
  track when we are at the live edge, and other helpers for live playback
  当我们在实时边缘时跟踪，并为实时播放提供其他帮助 */

/**
 * A class for checking live current time and determining when the player
 * is at or behind the live edge.
 * 一个类，用于检查实时当前时间并确定玩家何时处于活动边缘或在活动边缘之后。
 */
class LiveTracker extends Component {

  /**
   * Creates an instance of this class.
   * 创建此类的实例。
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *        这个类应该附加到的“Player”。
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {number} [options.trackingThreshold=30]
   *        Number of seconds of live window (seekableEnd - seekableStart) that
   *        media needs to have before the liveui will be shown.
   *
   * @param {number} [options.liveTolerance=15]
   *        Number of seconds behind live that we have to be
   *        before we will be considered non-live. Note that this will only
   *        be used when playing at the live edge. This allows large seekable end
   *        changes to not effect wether we are live or not.
   */
  constructor(player, options) {
    // LiveTracker does not need an element
    // LiveTracker不需要元素
    const options_ = mergeOptions(defaults, options, {createEl: false});

    super(player, options_);

    this.reset_();

    this.on(this.player_, 'durationchange', this.handleDurationchange);

    // we don't need to track live playback if the document is hidden,
    // also, tracking when the document is hidden can
    // cause the CPU to spike and eventually crash the page on IE11.
    // 如果文档被隐藏，我们不需要跟踪实时播放，而且，跟踪文档隐藏的时间会导致CPU峰值，
    // 并最终导致IE11上的页面崩溃。
    if (browser.IE_VERSION && 'hidden' in document && 'visibilityState' in document) {
      this.on(document, 'visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * toggle tracking based on document visiblility
   * 基于文档可视性的切换跟踪
   */
  handleVisibilityChange() {
    if (this.player_.duration() !== Infinity) {
      return;
    }

    if (document.hidden) {
      this.stopTracking();
    } else {
      this.startTracking();
    }
  }

  /**
   * all the functionality for tracking when seek end changes
   * and for tracking how far past seek end we should be
   * 所有的功能，用于跟踪搜索结束时的变化，以及跟踪我们应该到达的搜索结束时间
   */
  trackLive_() {
    const seekable = this.player_.seekable();

    // skip undefined seekable
    // 跳过未定义的可搜索
    if (!seekable || !seekable.length) {
      return;
    }

    const newTime = Number(window.performance.now().toFixed(4));
    const deltaTime = this.lastTime_ === -1 ? 0 : (newTime - this.lastTime_) / 1000;

    this.lastTime_ = newTime;

    this.pastSeekEnd_ = this.pastSeekEnd() + deltaTime;

    const liveCurrentTime = this.liveCurrentTime();
    const currentTime = this.player_.currentTime();

    // we are behind live if any are true
    // 如果有什么是真的，我们就落后了
    // 1. the player is paused
    // 2. the user seeked to a location 2 seconds away from live
    // 3. the difference between live and current time is greater
    //    liveTolerance which defaults to 15s
    // 1播放机暂停
    // 2。用户搜索到离现场2秒远的位置
    // 3。实时时间和当前时间之间的差异更大
    // liveTolerance默认为15秒
    let isBehind = this.player_.paused() || this.seekedBehindLive_ ||
      Math.abs(liveCurrentTime - currentTime) > this.options_.liveTolerance;


    if (!this.timeupdateSeen_ || liveCurrentTime === Infinity) {
      isBehind = false;
    }

    if (isBehind !== this.behindLiveEdge_) {
      this.behindLiveEdge_ = isBehind;
      this.trigger('liveedgechange');
    }
  }

  /**
   * handle a durationchange event on the player
   * and start/stop tracking accordingly.
   * 处理播放器上的durationchange事件并相应地开始/停止跟踪。
   */
  handleDurationchange() {
    if (this.player_.duration() === Infinity && this.liveWindow() >= this.options_.trackingThreshold) {
      if (this.player_.options_.liveui) {
        this.player_.addClass('vjs-liveui');
      }
      this.startTracking();
    } else {
      this.player_.removeClass('vjs-liveui');
      this.stopTracking();
    }
  }

  /**
   * start tracking live playback
   * 开始跟踪实时播放
   */
  startTracking() {
    if (this.isTracking()) {
      return;
    }

    // If we haven't seen a timeupdate, we need to check whether playback
    // began before this component started tracking. This can happen commonly
    // when using autoplay.
    // 如果我们还没有看到timeupdate，我们需要检查回放是否在这个组件开始跟踪之前就开始了。
    // 使用自动播放时，通常会发生这种情况。
    if (!this.timeupdateSeen_) {
      this.timeupdateSeen_ = this.player_.hasStarted();
    }

    this.trackingInterval_ = this.setInterval(this.trackLive_, Fn.UPDATE_REFRESH_INTERVAL);
    this.trackLive_();

    this.on(this.player_, ['play', 'pause'], this.trackLive_);

    if (!this.timeupdateSeen_) {
      this.one(this.player_, 'play', this.handlePlay);
      this.one(this.player_, 'timeupdate', this.handleFirstTimeupdate);
    } else {
      this.on(this.player_, 'seeked', this.handleSeeked);
    }
  }

  /**
   * handle the first timeupdate on the player if it wasn't already playing
   * when live tracker started tracking.
   * 处理播放器的第一次更新，如果它还没有播放时，实时跟踪开始跟踪。
   */
  handleFirstTimeupdate() {
    this.timeupdateSeen_ = true;
    this.on(this.player_, 'seeked', this.handleSeeked);
  }

  /**
   * Keep track of what time a seek starts, and listen for seeked
   * to find where a seek ends.
   * 记下搜索开始的时间，并倾听seeked，以找到seeked的结束位置。
   */
  handleSeeked() {
    const timeDiff = Math.abs(this.liveCurrentTime() - this.player_.currentTime());

    this.seekedBehindLive_ = this.skipNextSeeked_ ? false : timeDiff > 2;
    this.skipNextSeeked_ = false;
    this.trackLive_();
  }

  /**
   * handle the first play on the player, and make sure that we seek
   * right to the live edge.
   * 处理玩家的第一场比赛，并确保我们寻找的权利的生活边缘。
   */
  handlePlay() {
    this.one(this.player_, 'timeupdate', this.seekToLiveEdge);
  }

  /**
   * Stop tracking, and set all internal variables to
   * their initial value.
   * 停止跟踪，并将所有内部变量设置为初始值。
   */
  reset_() {
    this.lastTime_ = -1;
    this.pastSeekEnd_ = 0;
    this.lastSeekEnd_ = -1;
    this.behindLiveEdge_ = true;
    this.timeupdateSeen_ = false;
    this.seekedBehindLive_ = false;
    this.skipNextSeeked_ = false;

    this.clearInterval(this.trackingInterval_);
    this.trackingInterval_ = null;

    this.off(this.player_, ['play', 'pause'], this.trackLive_);
    this.off(this.player_, 'seeked', this.handleSeeked);
    this.off(this.player_, 'play', this.handlePlay);
    this.off(this.player_, 'timeupdate', this.handleFirstTimeupdate);
    this.off(this.player_, 'timeupdate', this.seekToLiveEdge);
  }

  /**
   * stop tracking live playback
   * 停止跟踪实时播放
   */
  stopTracking() {
    if (!this.isTracking()) {
      return;
    }
    this.reset_();
    this.trigger('liveedgechange');
  }

  /**
   * A helper to get the player seekable end
   * so that we don't have to null check everywhere
   * 一个助手，让玩家可以找到末端，这样我们就不必到处进行空检查
   * @return {number}
   *         The furthest seekable end or Infinity.
   */
  seekableEnd() {
    const seekable = this.player_.seekable();
    const seekableEnds = [];
    let i = seekable ? seekable.length : 0;

    while (i--) {
      seekableEnds.push(seekable.end(i));
    }

    // grab the furthest seekable end after sorting, or if there are none
    // default to Infinity
    // 如果在无限远之后没有搜索到，则排序是不可能的
    return seekableEnds.length ? seekableEnds.sort()[seekableEnds.length - 1] : Infinity;
  }

  /**
   * A helper to get the player seekable start
   * so that we don't have to null check everywhere
   * 一个助手，让player开始寻找，这样我们就不必到处进行空检查了
   * @return {number}
   *         The earliest seekable start or 0.
   */
  seekableStart() {
    const seekable = this.player_.seekable();
    const seekableStarts = [];
    let i = seekable ? seekable.length : 0;

    while (i--) {
      seekableStarts.push(seekable.start(i));
    }

    // grab the first seekable start after sorting, or if there are none
    // default to 0
    // 在排序后获取第一个可查找的开始，或者如果没有默认值为0
    return seekableStarts.length ? seekableStarts.sort()[0] : 0;
  }

  /**
   * Get the live time window aka
   * the amount of time between seekable start and
   * live current time.
   * 获取实时时间窗口，即可搜索开始时间和实时当前时间之间的时间量。
   * @return {number}
   *         The amount of seconds that are seekable in
   *         the live video.
   */
  liveWindow() {
    const liveCurrentTime = this.liveCurrentTime();

    if (liveCurrentTime === Infinity) {
      return Infinity;
    }

    return liveCurrentTime - this.seekableStart();
  }

  /**
   * Determines if the player is live, only checks if this component
   * is tracking live playback or not
   * 确定播放机是否处于活动状态，仅检查此组件是否正在跟踪实时播放
   * @return {boolean}
   *         Wether liveTracker is tracking
   */
  isLive() {
    return this.isTracking();
  }

  /**
   * Determines if currentTime is at the live edge and won't fall behind
   * on each seekableendchange
   * 确定currentTime是否处于活动边缘并且不会在每个可查找的更改上落后
   * @return {boolean}
   *         Wether playback is at the live edge
   */
  atLiveEdge() {
    return !this.behindLiveEdge();
  }

  /**
   * get what we expect the live current time to be
   * 获得我们所期望的现场当前时间
   * @return {number}
   *         The expected live current time
   */
  liveCurrentTime() {
    return this.pastSeekEnd() + this.seekableEnd();
  }

  /**
   * The number of seconds that have occured after seekable end
   * changed. This will be reset to 0 once seekable end changes.
   * 可查找结束更改后发生的秒数。一旦可查找的结束更改，此值将重置为0。
   * @return {number}
   *         Seconds past the current seekable end
   */
  pastSeekEnd() {
    const seekableEnd = this.seekableEnd();

    if (this.lastSeekEnd_ !== -1 && seekableEnd !== this.lastSeekEnd_) {
      this.pastSeekEnd_ = 0;
    }
    this.lastSeekEnd_ = seekableEnd;
    return this.pastSeekEnd_;
  }

  /**
   * If we are currently behind the live edge, aka currentTime will be
   * behind on a seekableendchange
   * 如果我们现在落后于live edge，aka currentTime将落后于一个可预见的变化
   * @return {boolean}
   *         If we are behind the live edge
   */
  behindLiveEdge() {
    return this.behindLiveEdge_;
  }

  /**
   * Wether live tracker is currently tracking or not.
   * 实时跟踪器是否正在跟踪。
   * @return {boolean}
   *        zzf add
   */
  isTracking() {
    return typeof this.trackingInterval_ === 'number';
  }

  /**
   * Seek to the live edge if we are behind the live edge
   * 如果我们在生活的边缘后面，就去寻找生活的边缘
   */
  seekToLiveEdge() {
    this.seekedBehindLive_ = false;
    if (this.atLiveEdge()) {
      return;
    }
    // skipNextSeeked_
    this.skipNextSeeked_ = true;
    this.player_.currentTime(this.liveCurrentTime());

  }

  /**
   * Dispose of liveTracker
   * 处理liveTracker
   */
  dispose() {
    this.off(document, 'visibilitychange', this.handleVisibilityChange);
    this.stopTracking();
    super.dispose();
  }
}

Component.registerComponent('LiveTracker', LiveTracker);
export default LiveTracker;
