/**
 * @file text-track.js
 */
import TextTrackCueList from './text-track-cue-list';
import * as Fn from '../utils/fn.js';
import {TextTrackKind, TextTrackMode} from './track-enums';
import log from '../utils/log.js';
import window from 'global/window';
import Track from './track.js';
import { isCrossOrigin } from '../utils/url.js';
import XHR from '@videojs/xhr';
import merge from '../utils/merge-options';

/**
 * Takes a webvtt file contents and parses it into cues
 * 提取一个webvtt文件内容并将其解析为提示
 *
 * @param {string} srcContent
 *        webVTT file contents
 *        webVTT文件内容
 *
 * @param {TextTrack} track
 *        TextTrack to add cues to. Cues come from the srcContent.
 *        要添加提示的TextTrack。 提示来自srcContent
 *
 * @private
 */
const parseCues = function(srcContent, track) {
  const parser = new window.WebVTT.Parser(
    window,
    window.vttjs,
    window.WebVTT.StringDecoder()
  );
  const errors = [];

  parser.oncue = function(cue) {
    track.addCue(cue);
  };

  parser.onparsingerror = function(error) {
    errors.push(error);
  };

  parser.onflush = function() {
    track.trigger({
      type: 'loadeddata',
      target: track
    });
  };

  parser.parse(srcContent);
  if (errors.length > 0) {
    if (window.console && window.console.groupCollapsed) {
      window.console.groupCollapsed(`Text Track parsing errors for ${track.src}`);
    }
    errors.forEach((error) => log.error(error));
    if (window.console && window.console.groupEnd) {
      window.console.groupEnd();
    }
  }

  parser.flush();
};

/**
 * Load a `TextTrack` from a specified url.
 * 从指定的网址加载`TextTrack`。
 *
 * @param {string} src
 *        Url to load track from.
 *        从中加载跟踪的网址
 *
 * @param {TextTrack} track
 *        Track to add cues to. Comes from the content at the end of `url`.
 *        跟踪以添加提示。 来自“ url”末尾的内容。
 *
 * @private
 */
const loadTrack = function(src, track) {
  const opts = {
    uri: src
  };
  const crossOrigin = isCrossOrigin(src);

  if (crossOrigin) {
    opts.cors = crossOrigin;
  }

  const withCredentials = track.tech_.crossOrigin() === 'use-credentials';

  if (withCredentials) {
    opts.withCredentials = withCredentials;
  }

  XHR(opts, Fn.bind(this, function(err, response, responseBody) {
    if (err) {
      return log.error(err, response);
    }

    track.loaded_ = true;

    // Make sure that vttjs has loaded, otherwise, wait till it finished loading
    // NOTE: this is only used for the alt/video.novtt.js build
    if (typeof window.WebVTT !== 'function') {
      if (track.tech_) {
        // to prevent use before define eslint error, we define loadHandler
        // as a let here
        track.tech_.any(['vttjsloaded', 'vttjserror'], (event) => {
          if (event.type === 'vttjserror') {
            log.error(`vttjs failed to load, stopping trying to process ${track.src}`);
            return;
          }
          return parseCues(responseBody, track);
        });
      }
    } else {
      parseCues(responseBody, track);
    }

  }));
};

/**
 * A representation of a single `TextTrack`.
 * 单个`TextTrack`的表示形式。
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack}
 * @extends Track
 */
class TextTrack extends Track {

  /**
   * Create an instance of this class.
   * 创建此类的实例。
   *
   * @param {Object} options={}
   *        Object of option names and values
   *        选项名称和值的对象
   *
   * @param {Tech} options.tech
   *        A reference to the tech that owns this TextTrack.
   *        对拥有此TextTrack的技术的引用。
   *
   * @param {TextTrack~Kind} [options.kind='subtitles']
   *        A valid text track kind.
   *        有效的文本跟踪类型。
   *
   * @param {TextTrack~Mode} [options.mode='disabled']
   *        A valid text track mode.
   *        有效的文本跟踪模式。
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this TextTrack.
   *        此TextTrack的唯一ID。
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
   *        version of `options.language`
   *        有效的两个字符的语言代码。 options.language的替代版本，但优先级较高
   *
   * @param {string} [options.src]
   *        A url to TextTrack cues.
   *        TextTrack提示的网址。
   *
   * @param {boolean} [options.default]
   *        If this track should default to on or off.
   *        如果此轨道应默认设置为打开或关闭。
   */
  constructor(options = {}) {
    if (!options.tech) {
      throw new Error('A tech was not provided.');
    }

    const settings = merge(options, {
      kind: TextTrackKind[options.kind] || 'subtitles',
      language: options.language || options.srclang || ''
    });
    let mode = TextTrackMode[settings.mode] || 'disabled';
    const default_ = settings.default;

    if (settings.kind === 'metadata' || settings.kind === 'chapters') {
      mode = 'hidden';
    }
    super(settings);

    this.tech_ = settings.tech;

    this.cues_ = [];
    this.activeCues_ = [];

    this.preload_ = this.tech_.preloadTextTracks !== false;

    const cues = new TextTrackCueList(this.cues_);
    const activeCues = new TextTrackCueList(this.activeCues_);
    let changed = false;
    const timeupdateHandler = Fn.bind(this, function() {

      // Accessing this.activeCues for the side-effects of updating itself
      // due to its nature as a getter function. Do not remove or cues will
      // stop updating!
      // Use the setter to prevent deletion from uglify (pure_getters rule)
      this.activeCues = this.activeCues;
      if (changed) {
        this.trigger('cuechange');
        changed = false;
      }
    });

    if (mode !== 'disabled') {
      this.tech_.ready(() => {
        this.tech_.on('timeupdate', timeupdateHandler);
      }, true);
    }

    Object.defineProperties(this, {
      /**
       * @memberof TextTrack
       * @member {boolean} default
       *         If this track was set to be on or off by default. Cannot be changed after
       *         creation.
       *         默认情况下将此轨道设置为打开还是关闭。 创建后无法更改。
       * @instance
       *
       * @readonly
       */
      default: {
        get() {
          return default_;
        },
        set() {}
      },

      /**
       * @memberof TextTrack
       * @member {string} mode
       *         Set the mode of this TextTrack to a valid {@link TextTrack~Mode}. Will
       *         not be set if setting to an invalid mode.
       *         将此TextTrack的模式设置为有效的{@link TextTrack〜Mode}。 如果设置为无效模式，则不会设置。
       * @instance
       *
       * @fires TextTrack#modechange
       */
      mode: {
        get() {
          return mode;
        },
        set(newMode) {
          if (!TextTrackMode[newMode]) {
            return;
          }
          mode = newMode;
          if (!this.preload_ && mode !== 'disabled' && this.cues.length === 0) {
            // On-demand load.
            loadTrack(this.src, this);
          }
          if (mode !== 'disabled') {
            this.tech_.ready(() => {
              this.tech_.on('timeupdate', timeupdateHandler);
            }, true);
          } else {
            this.tech_.off('timeupdate', timeupdateHandler);
          }
          /**
           * An event that fires when mode changes on this track. This allows
           * the TextTrackList that holds this track to act accordingly.
           * 当此轨道上的模式更改时触发的事件。 这允许保存此轨道的TextTrackList相应地采取行动。
           *
           * > Note: This is not part of the spec!
           * 注意：这不是规范的一部分！
           *
           * @event TextTrack#modechange
           * @type {EventTarget~Event}
           */
          this.trigger('modechange');

        }
      },

      /**
       * @memberof TextTrack
       * @member {TextTrackCueList} cues
       *         The text track cue list for this TextTrack.
       *         此TextTrack的文本轨道提示列表。
       * @instance
       */
      cues: {
        get() {
          if (!this.loaded_) {
            return null;
          }

          return cues;
        },
        set() {}
      },

      /**
       * @memberof TextTrack
       * @member {TextTrackCueList} activeCues
       *         The list text track cues that are currently active for this TextTrack.
       *         列出此TextTrack当前处于活动状态的文本轨道提示。
       * @instance
       */
      activeCues: {
        get() {
          if (!this.loaded_) {
            return null;
          }

          // nothing to do
          if (this.cues.length === 0) {
            return activeCues;
          }

          const ct = this.tech_.currentTime();
          const active = [];

          for (let i = 0, l = this.cues.length; i < l; i++) {
            const cue = this.cues[i];

            if (cue.startTime <= ct && cue.endTime >= ct) {
              active.push(cue);
            } else if (cue.startTime === cue.endTime &&
                       cue.startTime <= ct &&
                       cue.startTime + 0.5 >= ct) {
              active.push(cue);
            }
          }

          changed = false;

          if (active.length !== this.activeCues_.length) {
            changed = true;
          } else {
            for (let i = 0; i < active.length; i++) {
              if (this.activeCues_.indexOf(active[i]) === -1) {
                changed = true;
              }
            }
          }

          this.activeCues_ = active;
          activeCues.setCues_(this.activeCues_);

          return activeCues;
        },

        // /!\ Keep this setter empty (see the timeupdate handler above)
        set() {}
      }
    });

    if (settings.src) {
      this.src = settings.src;
      if (!this.preload_) {
        // Tracks will load on-demand.
        // Act like we're loaded for other purposes.
        this.loaded_ = true;
      }
      if (this.preload_ || default_ || (settings.kind !== 'subtitles' && settings.kind !== 'captions')) {
        loadTrack(this.src, this);
      }
    } else {
      this.loaded_ = true;
    }
  }

  /**
   * Add a cue to the internal list of cues.
   * 将提示添加到内部提示列表中。
   *
   * @param {TextTrack~Cue} originalCue
   *        The cue to add to our internal list
   *        添加到我们内部列表的提示
   */
  addCue(originalCue) {
    let cue = originalCue;

    if (window.vttjs && !(originalCue instanceof window.vttjs.VTTCue)) {
      cue = new window.vttjs.VTTCue(originalCue.startTime, originalCue.endTime, originalCue.text);

      for (const prop in originalCue) {
        if (!(prop in cue)) {
          cue[prop] = originalCue[prop];
        }
      }

      // make sure that `id` is copied over
      cue.id = originalCue.id;
      cue.originalCue_ = originalCue;
    }

    const tracks = this.tech_.textTracks();

    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i] !== this) {
        tracks[i].removeCue(cue);
      }
    }

    this.cues_.push(cue);
    this.cues.setCues_(this.cues_);
  }

  /**
   * Remove a cue from our internal list
   * 从我们的内部列表中删除提示
   *
   * @param {TextTrack~Cue} removeCue
   *        The cue to remove from our internal list
   *        从我们的内部列表中删除的提示
   */
  removeCue(removeCue) {
    let i = this.cues_.length;

    while (i--) {
      const cue = this.cues_[i];

      if (cue === removeCue || (cue.originalCue_ && cue.originalCue_ === removeCue)) {
        this.cues_.splice(i, 1);
        this.cues.setCues_(this.cues_);
        break;
      }
    }
  }
}

/**
 * cuechange - One or more cues in the track have become active or stopped being active.
 * cuechange-轨道中的一个或多个提示已变为活动状态或已停止活动。
 */
TextTrack.prototype.allowedEvents_ = {
  cuechange: 'cuechange'
};

export default TextTrack;
