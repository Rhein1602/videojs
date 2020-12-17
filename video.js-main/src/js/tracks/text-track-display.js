/**
 * @file text-track-display.js
 */
import Component from '../component';
import * as Fn from '../utils/fn.js';
import * as Dom from '../utils/dom.js';
import window from 'global/window';

const darkGray = '#222';
const lightGray = '#ccc';
const fontMap = {
  monospace: 'monospace',
  sansSerif: 'sans-serif',
  serif: 'serif',
  monospaceSansSerif: '"Andale Mono", "Lucida Console", monospace',
  monospaceSerif: '"Courier New", monospace',
  proportionalSansSerif: 'sans-serif',
  proportionalSerif: 'serif',
  casual: '"Comic Sans MS", Impact, fantasy',
  script: '"Monotype Corsiva", cursive',
  smallcaps: '"Andale Mono", "Lucida Console", monospace, sans-serif'
};

/**
 * Construct an rgba color from a given hex color code.
 * 根据给定的十六进制颜色代码构造一个rgba颜色。
 *
 * @param {number} color
 *        Hex number for color, like #f0e or #f604e2.
 *        颜色的十六进制数字，例如＃f0e或＃f604e2。
 *
 * @param {number} opacity
 *        Value for opacity, 0.0 - 1.0.
 *        不透明度的值，0.0-1.0。
 *
 * @return {string}
 *         The rgba color that was created, like 'rgba(255, 0, 0, 0.3)'.
 *         创建的rgba颜色，例如'rgba（255，0，0，0.3）'。
 */
export function constructColor(color, opacity) {
  let hex;

  if (color.length === 4) {
    // color looks like "#f0e"
    hex = color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  } else if (color.length === 7) {
    // color looks like "#f604e2"
    hex = color.slice(1);
  } else {
    throw new Error('Invalid color code provided, ' + color + '; must be formatted as e.g. #f0e or #f604e2.');
  }
  return 'rgba(' +
    parseInt(hex.slice(0, 2), 16) + ',' +
    parseInt(hex.slice(2, 4), 16) + ',' +
    parseInt(hex.slice(4, 6), 16) + ',' +
    opacity + ')';
}

/**
 * Try to update the style of a DOM element. Some style changes will throw an error,
 * particularly in IE8. Those should be noops.
 * 尝试更新DOM元素的样式。 某些样式更改将引发错误，尤其是在IE8中。 那些应该没有。
 *
 * @param {Element} el
 *        The DOM element to be styled.
 *        要设置样式的DOM元素。
 *
 * @param {string} style
 *        The CSS property on the element that should be styled.
 *        应该设置样式的元素上的CSS属性。
 *
 * @param {string} rule
 *        The style rule that should be applied to the property.
 *        应该应用于属性的样式规则。
 *
 * @private
 */
function tryUpdateStyle(el, style, rule) {
  try {
    el.style[style] = rule;
  } catch (e) {

    // Satisfies linter.
    return;
  }
}

/**
 * The component for displaying text track cues.
 * 用于显示文本跟踪提示的组件。
 *
 * @extends Component
 */
class TextTrackDisplay extends Component {

  /**
   * Creates an instance of this class.
   * 创建此类的实例。
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *        此类应附加到的“玩家”。
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *        玩家选项的键/值存储。
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when `TextTrackDisplay` is ready.
   *        当TextTrackDisplay准备就绪时调用的函数。
   */
  constructor(player, options, ready) {
    super(player, options, ready);

    const updateDisplayHandler = Fn.bind(this, this.updateDisplay);

    player.on('loadstart', Fn.bind(this, this.toggleDisplay));
    player.on('texttrackchange', updateDisplayHandler);
    player.on('loadedmetadata', Fn.bind(this, this.preselectTrack));

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    //以前在播放器初始化期间调用了此方法，但如果默认情况下应显示轨道且尚未加载显示，则会导致错误。
    // 当我们支持不需要显示的轨道时，应该将其移动到外部轨道加载器。
    player.ready(Fn.bind(this, function() {
      if (player.tech_ && player.tech_.featuresNativeTextTracks) {
        this.hide();
        return;
      }

      player.on('fullscreenchange', updateDisplayHandler);
      player.on('playerresize', updateDisplayHandler);

      window.addEventListener('orientationchange', updateDisplayHandler);
      player.on('dispose', () => window.removeEventListener('orientationchange', updateDisplayHandler));

      const tracks = this.options_.playerOptions.tracks || [];

      for (let i = 0; i < tracks.length; i++) {
        this.player_.addRemoteTextTrack(tracks[i], true);
      }

      this.preselectTrack();
    }));
  }

  /**
  * Preselect a track following this precedence:
   * 按照此优先级预选音轨：
  * - matches the previously selected {@link TextTrack}'s language and kind
  * - matches the previously selected {@link TextTrack}'s language only
  * - is the first default captions track
  * - is the first default descriptions track
  * -与先前选择的{@link TextTrack}的语言和种类匹配
  * -仅与先前选择的{@link TextTrack}的语言匹配
  * -是第一个默认字幕轨道
  * -是第一个默认描述轨道
  * @listens Player#loadstart
  */
  preselectTrack() {
    const modes = {captions: 1, subtitles: 1};
    const trackList = this.player_.textTracks();
    const userPref = this.player_.cache_.selectedLanguage;
    let firstDesc;
    let firstCaptions;
    let preferredTrack;

    for (let i = 0; i < trackList.length; i++) {
      const track = trackList[i];

      if (
        userPref && userPref.enabled &&
        userPref.language && userPref.language === track.language &&
        track.kind in modes
      ) {
        // Always choose the track that matches both language and kind
        //始终选择与语言和种类都匹配的音轨
        if (track.kind === userPref.kind) {
          preferredTrack = track;
        // or choose the first track that matches languag.
        // 或选择与语言匹配的第一首音轨
        } else if (!preferredTrack) {
          preferredTrack = track;
        }

      // clear everything if offTextTrackMenuItem was clicked
      // 如果单击offTextTrackMenuItem，则清除所有内容
      } else if (userPref && !userPref.enabled) {
        preferredTrack = null;
        firstDesc = null;
        firstCaptions = null;

      } else if (track.default) {
        if (track.kind === 'descriptions' && !firstDesc) {
          firstDesc = track;
        } else if (track.kind in modes && !firstCaptions) {
          firstCaptions = track;
        }
      }
    }

    // The preferredTrack matches the user preference and takes
    // precedence over all the other tracks.
    // So, display the preferredTrack before the first default track
    // and the subtitles/captions track before the descriptions track
    // preferredTrack与用户首选项匹配，并且优先于所有其他轨道。
    // 因此，请在第一个默认轨道之前显示preferredTrack，在描述轨道之前显示字幕/标题轨道
    if (preferredTrack) {
      preferredTrack.mode = 'showing';
    } else if (firstCaptions) {
      firstCaptions.mode = 'showing';
    } else if (firstDesc) {
      firstDesc.mode = 'showing';
    }
  }

  /**
   * Turn display of {@link TextTrack}'s from the current state into the other state.
   * There are only two states:
   * 将{@link TextTrack}的显示从当前状态转换为其他状态。 只有两种状态：
   *
   * - 'shown'
   * - 'hidden'
   *
   * -"显示"
   * -"隐藏"
   *
   * @listens Player#loadstart
   */
  toggleDisplay() {
    if (this.player_.tech_ && this.player_.tech_.featuresNativeTextTracks) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Create the {@link Component}'s DOM element.
   * 创建{@link Component}的DOM元素。
   *
   * @return {Element}
   *         The element that was created.
   *         创建的元素。
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-text-track-display'
    }, {
      'aria-live': 'off',
      'aria-atomic': 'true'
    });
  }

  /**
   * Clear all displayed {@link TextTrack}s.
   * 清除所有显示的{@link TextTrack}。
   */
  clearDisplay() {
    if (typeof window.WebVTT === 'function') {
      window.WebVTT.processCues(window, [], this.el_);
    }
  }

  /**
   * Update the displayed TextTrack when a either a {@link Player#texttrackchange} or
   * a {@link Player#fullscreenchange} is fired.
   * 触发{@link Player＃texttrackchange}或{@link Player＃fullscreenchange}时，更新显示的TextTrack。
   *
   * @listens Player#texttrackchange
   * @listens Player#fullscreenchange
   */
  updateDisplay() {
    const tracks = this.player_.textTracks();
    const allowMultipleShowingTracks = this.options_.allowMultipleShowingTracks;

    this.clearDisplay();

    if (allowMultipleShowingTracks) {
      const showingTracks = [];

      for (let i = 0; i < tracks.length; ++i) {
        const track = tracks[i];

        if (track.mode !== 'showing') {
          continue;
        }
        showingTracks.push(track);
      }
      this.updateForTrack(showingTracks);
      return;
    }

    //  Track display prioritization model: if multiple tracks are 'showing',
    //  display the first 'subtitles' or 'captions' track which is 'showing',
    //  otherwise display the first 'descriptions' track which is 'showing'
    //  音轨显示优先模型：如果“正在显示”多个音轨，
    //  显示首个“正在显示”的“字幕”或“字幕”轨道，
    //  否则显示“正在显示”的第一个“描述”轨道

    let descriptionsTrack = null;
    let captionsSubtitlesTrack = null;
    let i = tracks.length;

    while (i--) {
      const track = tracks[i];

      if (track.mode === 'showing') {
        if (track.kind === 'descriptions') {
          descriptionsTrack = track;
        } else {
          captionsSubtitlesTrack = track;
        }
      }
    }

    if (captionsSubtitlesTrack) {
      if (this.getAttribute('aria-live') !== 'off') {
        this.setAttribute('aria-live', 'off');
      }
      this.updateForTrack(captionsSubtitlesTrack);
    } else if (descriptionsTrack) {
      if (this.getAttribute('aria-live') !== 'assertive') {
        this.setAttribute('aria-live', 'assertive');
      }
      this.updateForTrack(descriptionsTrack);
    }
  }

  /**
   * Style {@Link TextTrack} activeCues according to {@Link TextTrackSettings}.
   * 根据{@Link TextTrackSettings}设置{@Link TextTrack} activeCues的样式。
   *
   * @param {TextTrack} track
   *        Text track object containing active cues to style.
   *        文本跟踪对象，包含要设置样式的活动提示。
   */
  updateDisplayState(track) {
    const overrides = this.player_.textTrackSettings.getValues();
    const cues = track.activeCues;

    let i = cues.length;

    while (i--) {
      const cue = cues[i];

      if (!cue) {
        continue;
      }

      const cueDiv = cue.displayState;

      if (overrides.color) {
        cueDiv.firstChild.style.color = overrides.color;
      }
      if (overrides.textOpacity) {
        tryUpdateStyle(
          cueDiv.firstChild,
          'color',
          constructColor(
            overrides.color || '#fff',
            overrides.textOpacity
          )
        );
      }
      if (overrides.backgroundColor) {
        cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor;
      }
      if (overrides.backgroundOpacity) {
        tryUpdateStyle(
          cueDiv.firstChild,
          'backgroundColor',
          constructColor(
            overrides.backgroundColor || '#000',
            overrides.backgroundOpacity
          )
        );
      }
      if (overrides.windowColor) {
        if (overrides.windowOpacity) {
          tryUpdateStyle(
            cueDiv,
            'backgroundColor',
            constructColor(overrides.windowColor, overrides.windowOpacity)
          );
        } else {
          cueDiv.style.backgroundColor = overrides.windowColor;
        }
      }
      if (overrides.edgeStyle) {
        if (overrides.edgeStyle === 'dropshadow') {
          cueDiv.firstChild.style.textShadow = `2px 2px 3px ${darkGray}, 2px 2px 4px ${darkGray}, 2px 2px 5px ${darkGray}`;
        } else if (overrides.edgeStyle === 'raised') {
          cueDiv.firstChild.style.textShadow = `1px 1px ${darkGray}, 2px 2px ${darkGray}, 3px 3px ${darkGray}`;
        } else if (overrides.edgeStyle === 'depressed') {
          cueDiv.firstChild.style.textShadow = `1px 1px ${lightGray}, 0 1px ${lightGray}, -1px -1px ${darkGray}, 0 -1px ${darkGray}`;
        } else if (overrides.edgeStyle === 'uniform') {
          cueDiv.firstChild.style.textShadow = `0 0 4px ${darkGray}, 0 0 4px ${darkGray}, 0 0 4px ${darkGray}, 0 0 4px ${darkGray}`;
        }
      }
      if (overrides.fontPercent && overrides.fontPercent !== 1) {
        const fontSize = window.parseFloat(cueDiv.style.fontSize);

        cueDiv.style.fontSize = (fontSize * overrides.fontPercent) + 'px';
        cueDiv.style.height = 'auto';
        cueDiv.style.top = 'auto';
      }
      if (overrides.fontFamily && overrides.fontFamily !== 'default') {
        if (overrides.fontFamily === 'small-caps') {
          cueDiv.firstChild.style.fontVariant = 'small-caps';
        } else {
          cueDiv.firstChild.style.fontFamily = fontMap[overrides.fontFamily];
        }
      }
    }
  }

  /**
   * Add an {@link TextTrack} to to the {@link Tech}s {@link TextTrackList}.
   * 将{@link TextTrack}添加到{@link Tech}的{@link TextTrackList}。
   *
   * @param {TextTrack|TextTrack[]} tracks
   *        Text track object or text track array to be added to the list.
   *        文本轨道对象或文本轨道数组要添加到列表中。
   */
  updateForTrack(tracks) {
    if (!Array.isArray(tracks)) {
      tracks = [tracks];
    }
    if (typeof window.WebVTT !== 'function' ||
      tracks.every((track)=> {
        return !track.activeCues;
      })) {
      return;
    }

    const cues = [];

    // push all active track cues
    for (let i = 0; i < tracks.length; ++i) {
      const track = tracks[i];

      for (let j = 0; j < track.activeCues.length; ++j) {
        cues.push(track.activeCues[j]);
      }
    }

    // removes all cues before it processes new ones
    window.WebVTT.processCues(window, cues, this.el_);

    // add unique class to each language text track & add settings styling if necessary
    for (let i = 0; i < tracks.length; ++i) {
      const track = tracks[i];

      for (let j = 0; j < track.activeCues.length; ++j) {
        const cueEl = track.activeCues[j].displayState;

        Dom.addClass(cueEl, 'vjs-text-track-cue');
        Dom.addClass(cueEl, 'vjs-text-track-cue-' + ((track.language) ? track.language : i));
      }
      if (this.player_.textTrackSettings) {
        this.updateDisplayState(track);
      }
    }
  }

}

Component.registerComponent('TextTrackDisplay', TextTrackDisplay);
export default TextTrackDisplay;
