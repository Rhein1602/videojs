/**
 * @file player.js
 */
// 子组件
import Component from './component.js';

import {version} from '../../package.json';
import document from 'global/document';
import window from 'global/window';
import evented from './mixins/evented';
import {isEvented, addEventedCallback} from './mixins/evented';
import * as Events from './utils/events.js';
import * as Dom from './utils/dom.js';
import * as Fn from './utils/fn.js';
import * as Guid from './utils/guid.js';
import * as browser from './utils/browser.js';
import {IE_VERSION, IS_CHROME, IS_WINDOWS} from './utils/browser.js';
import log, { createLogger } from './utils/log.js';
import {toTitleCase, titleCaseEquals} from './utils/string-cases.js';
import { createTimeRange } from './utils/time-ranges.js';
import { bufferedPercent } from './utils/buffer.js';
import * as stylesheet from './utils/stylesheet.js';
import FullscreenApi from './fullscreen-api.js';
import MediaError from './media-error.js';
import safeParseTuple from 'safe-json-parse/tuple';
import {assign} from './utils/obj';
import mergeOptions from './utils/merge-options.js';
import {silencePromise, isPromise} from './utils/promise';
import textTrackConverter from './tracks/text-track-list-converter.js';
import ModalDialog from './modal-dialog';
import Tech from './tech/tech.js';
import * as middleware from './tech/middleware.js';
import {ALL as TRACK_TYPES} from './tracks/track-types';
import filterSource from './utils/filter-source';
import {getMimetype, findMimetype} from './utils/mimetypes';
import keycode from 'keycode';

// The following imports are used only to ensure that the corresponding modules
// are always included in the video.js package. Importing the modules will
// execute them and they will register themselves with video.js.
// 以下导入仅用于确保相应的模块始终包含在视频.js包裹。导入模块将执行它们，它们将注册到videojs.
import './tech/loader.js';
import './poster-image.js';
import './tracks/text-track-display.js';
import './loading-spinner.js';
import './big-play-button.js';
import './close-button.js';
import './control-bar/control-bar.js';
import './error-display.js';
import './tracks/text-track-settings.js';
import './resize-manager.js';
import './live-tracker.js';
import './title-bar.js';

// 导入html5支持，使其至少可以处理原始的video标签
import './tech/html5.js';

// The following tech events are simply re-triggered
// on the player when they happen
// 以下技术事件只是在发生时在播放器上重新触发
const TECH_EVENTS_RETRIGGER = [
  /**
   * Fired while the user agent is downloading media data.
   * 用户在下载媒体时数据时触发。
   * @event Player#progress
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `progress` event that was triggered by the {@link Tech}.
   * 通过tech重新触发‘progerss’
   * @private
   * @method Player#handleTechProgress_
   * @fires Player#progress
   * @listens Tech#progress
   */
  'progress',

  /**
   * Fires when the loading of an audio/video is aborted.
   * 视频/音频终止时触发
   * @event Player#abort
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `abort` event that was triggered by the {@link Tech}.
   * 重新触发tech中触发的‘abort’事件
   * @private
   * @method Player#handleTechAbort_
   * @fires Player#abort
   * @listens Tech#abort
   */
  'abort',

  /**
   * Fires when the browser is intentionally not getting media data.
   * 当浏览器不希望获取数据时触发
   * @event Player#suspend
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `suspend` event that was triggered by the {@link Tech}.
   * 重新触发由{@link Tech}触发的“suspend”事件。
   * @private
   * @method Player#handleTechSuspend_
   * @fires Player#suspend
   * @listens Tech#suspend
   */
  'suspend',

  /**
   * Fires when the current playlist is empty.
   * 当播放器列表为空时触发
   * @event Player#emptied
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `emptied` event that was triggered by the {@link Tech}.
   * 重新触发由{@link Tech}触发的“emptied”事件。
   * @private
   * @method Player#handleTechEmptied_
   * @fires Player#emptied
   * @listens Tech#emptied
   */
  'emptied',
  /**
   * Fires when the browser is trying to get media data, but data is not available.
   * 当浏览器尝试获取数据时，却无法获取数据时触发。
   * @event Player#stalled
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `stalled` event that was triggered by the {@link Tech}.
   * 重新触发由{@link Tech}触发的“stalled”事件。
   * @private
   * @method Player#handleTechStalled_
   * @fires Player#stalled
   * @listens Tech#stalled
   */
  'stalled',

  /**
   * Fires when the browser has loaded meta data for the audio/video.
   * 当浏览器已加载音频/视频的元数据时激发。
   * @event Player#loadedmetadata
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `stalled` event that was triggered by the {@link Tech}.
   * 重新触发由{@link Tech}触发的“stalled”事件。
   * @private
   * @method Player#handleTechLoadedmetadata_
   * @fires Player#loadedmetadata
   * @listens Tech#loadedmetadata
   */
  'loadedmetadata',

  /**
   * Fires when the browser has loaded the current frame of the audio/video.
   *
   * @event Player#loadeddata
   * @type {event}
   */
  /**
   * Retrigger the `loadeddata` event that was triggered by the {@link Tech}.
   * 当浏览器已加载音频/视频的当前帧时激发。
   * @private
   * @method Player#handleTechLoaddeddata_
   * @fires Player#loadeddata
   * @listens Tech#loadeddata
   */
  'loadeddata',

  /**
   * Fires when the current playback position has changed.
   *
   * @event Player#timeupdate
   * @type {event}
   */
  /**
   * Retrigger the `timeupdate` event that was triggered by the {@link Tech}.
   * 当前播放位置更改时激发。
   * @private
   * @method Player#handleTechTimeUpdate_
   * @fires Player#timeupdate
   * @listens Tech#timeupdate
   */
  'timeupdate',

  /**
   * Fires when the video's intrinsic dimensions change
   * 当视频的内在尺寸改变时触发
   * @event Player#resize
   * @type {event}
   */
  /**
   * Retrigger the `resize` event that was triggered by the {@link Tech}.
   * 重新触发由{@link Tech}触发的“resize”事件。
   * @private
   * @method Player#handleTechResize_
   * @fires Player#resize
   * @listens Tech#resize
   */
  'resize',

  /**
   * Fires when the volume has been changed
   * 更改音量时激发
   * @event Player#volumechange
   * @type {event}
   */
  /**
   * Retrigger the `volumechange` event that was triggered by the {@link Tech}.
   * 重新触发{@link Tech}触发的“volumechange”事件
   * @private
   * @method Player#handleTechVolumechange_
   * @fires Player#volumechange
   * @listens Tech#volumechange
   */
  'volumechange',

  /**
   * Fires when the text track has been changed
   * 当文本轨迹已更改时激发
   * @event Player#texttrackchange
   * @type {event}
   */
  /**
   * Retrigger the `texttrackchange` event that was triggered by the {@link Tech}.
   * 重新触发由{@link Tech}触发的“texttrackchange”事件
   * @private
   * @method Player#handleTechTexttrackchange_
   * @fires Player#texttrackchange
   * @listens Tech#texttrackchange
   */
  'texttrackchange'
];

// events to queue when playback rate is zero
// this is a hash for the sole purpose of mapping non-camel-cased event names
// to camel-cased function names
// 播放速率为零时要排队的事件这是一个散列，其唯一目的是将非大小写事件名称映射为大小写混合的函数名称
const TECH_EVENTS_QUEUE = {
  canplay: 'CanPlay',
  canplaythrough: 'CanPlayThrough',
  playing: 'Playing',
  seeked: 'Seeked'
};

const BREAKPOINT_ORDER = [
  'tiny',
  'xsmall',
  'small',
  'medium',
  'large',
  'xlarge',
  'huge'
];

const BREAKPOINT_CLASSES = {};

// grep: vjs-layout-tiny
// grep: vjs-layout-x-small
// grep: vjs-layout-small
// grep: vjs-layout-medium
// grep: vjs-layout-large
// grep: vjs-layout-x-large
// grep: vjs-layout-huge
BREAKPOINT_ORDER.forEach(k => {
  const v = k.charAt(0) === 'x' ? `x-${k.substring(1)}` : k;

  BREAKPOINT_CLASSES[k] = `vjs-layout-${v}`;
});

const DEFAULT_BREAKPOINTS = {
  tiny: 210,
  xsmall: 320,
  small: 425,
  medium: 768,
  large: 1440,
  xlarge: 2560,
  huge: Infinity
};

/**
 * An instance of the `Player` class is created when any of the Video.js setup methods
 * are used to initialize a video.
 * 使用video.js设置方法用于初始化视频播放器类。
 * After an instance has been created it can be accessed globally in two ways:
 * 利用下面两个方法可以获得全局的player对象
 * 1. By calling `videojs('example_video_1');`
 * 2. By using it directly via  `videojs.players.example_video_1;`
 *
 * @extends Component
 */
class Player extends Component {

  /**
   * Create an instance of this class.
   * 创建此类的实例。
   * @param {Element} tag
   *        The original video DOM element used for configuring options.
   *
   * @param {Object} [options]
   *        Object of option names and values.
   *        用于配置选项的原始视频DOM元素。
   * @param {Component~ReadyCallback} [ready]
   *        Ready callback function.
   *        播放器准备就绪时的回调函数
   */
  constructor(tag, options, ready) {
    // Make sure tag ID exists
    // 确认标签id是否存在
    tag.id = tag.id || options.id || `vjs_video_${Guid.newGUID()}`;

    // 设置选项
    // The options argument overrides options set in the video tag
    // which overrides globally set options.
    // options参数重写在video标记中设置的选项，后者覆盖全局设置的选项。
    // This latter part coincides with the load order
    // 后一部分与荷载顺序一致
    // (tag must exist before Player)
    options = assign(Player.getTagSettings(tag), options);

    // Delay the initialization of children because we need to set up
    // player properties first, and can't use `this` before `super()`
    // 延迟子级的初始化，因为我们需要先设置播放器属性，并且不能在“super（）”之前使用”this（）“
    options.initChildren = false;

    // 与创建元素相同
    options.createEl = false;

    // don't auto mixin the evented mixin
    // 不要在事件混音中自动混音
    options.evented = false;

    // we don't want the player to report touch activity on itself
    // see enableTouchActivity in Component
    // 我们不想让播放器报告自己的触摸活动，详情请参阅组件中的enableToughActivity
    options.reportTouchActivity = false;

    // If language is not set, get the closest lang attribute
    // 如果未设置语言，请获取最近的lang属性
    if (!options.language) {
      if (typeof tag.closest === 'function') {
        const closest = tag.closest('[lang]');

        if (closest && closest.getAttribute) {
          options.language = closest.getAttribute('lang');
        }
      } else {
        let element = tag;

        while (element && element.nodeType === 1) {
          if (Dom.getAttributes(element).hasOwnProperty('lang')) {
            options.language = element.getAttribute('lang');
            break;
          }
          element = element.parentNode;
        }
      }
    }

    // Run base component initializing with new options
    // 使用新选项运行基本组件初始化
    super(null, options, ready);

    // 为文档侦听器创建绑定方法。
    this.boundDocumentFullscreenChange_ = Fn.bind(this, this.documentFullscreenChange_);
    this.boundFullWindowOnEscKey_ = Fn.bind(this, this.fullWindowOnEscKey);

    // 全屏显示默认为false
    this.isFullscreen_ = false;

    // 创建记录器
    this.log = createLogger(this.id_);

    // Hold our own reference to fullscreen api so it can be mocked in tests
    // 保留我们自己对全屏api的引用，以便可以在测试中模拟它
    this.fsApi_ = FullscreenApi;

    // Tracks when a tech changes the poster
    // 当调用更改海报方法时进行追踪
    this.isPosterFromTech_ = false;

    // Holds callback info that gets queued when playback rate is zero
    // and a seek is happening
    // 保存在播放速率为零时排队的回调信息
    this.queuedCallbacks_ = [];

    // Turn off API access because we're loading a new tech that might load asynchronously
    // 关闭API访问，因为我们正在加载可能异步加载的新技术
    this.isReady_ = false;

    // Init state hasStarted_
    // 初始化hasStarted_的状态
    this.hasStarted_ = false;

    // Init state userActive_
    // 初始化userActive_状态
    this.userActive_ = false;

    // Init debugEnabled_
    // 初始化debugEnabled_
    this.debugEnabled_ = false;

    // if the global option object was accidentally blown away by
    // someone, bail early with an informative error
    // 如果全局选项对象意外地被某人销毁了，提前退出并显示一个信息错误
    if (!this.options_ ||
        !this.options_.techOrder ||
        !this.options_.techOrder.length) {
      throw new Error('No techOrder specified. Did you overwrite ' +
                      'videojs.options instead of just changing the ' +
                      'properties you want to override?');
    }

    // Store the original tag used to set options
    // 存储用于设置选项的原始标记
    this.tag = tag;

    // Store the tag attributes used to restore html5 element
    // 存储用于恢复html5元素的标记属性
    this.tagAttributes = tag && Dom.getAttributes(tag);

    // Update current language
    // 更新当前语言
    this.language(this.options_.language);

    // Update Supported Languages
    // 更新支持的语言
    if (options.languages) {
      // Normalise player option languages to lowercase
      // 将播放器选项语言规范化为小写
      const languagesToLower = {};

      Object.getOwnPropertyNames(options.languages).forEach(function(name) {
        languagesToLower[name.toLowerCase()] = options.languages[name];
      });
      this.languages_ = languagesToLower;
    } else {
      this.languages_ = Player.prototype.options_.languages;
    }

    this.resetCache_();

    // Set poster
    // 设置封面
    this.poster_ = options.poster || '';

    // Set controls
    // 设置控制器
    this.controls_ = !!options.controls;

    // Original tag settings stored in options
    // now remove immediately so native controls don't flash.
    // May be turned back on by HTML5 tech if nativeControlsForTouch is true
    // 存储在选项中的原始标记设置现在立即删除，这样本机控件就不会闪烁。
    // 如果nativeControlsForTouch为真，则可能被HTML5技术重新打开
    tag.controls = false;
    tag.removeAttribute('controls');

    this.changingSrc_ = false;
    this.playCallbacks_ = [];
    this.playTerminatedQueue_ = [];

    // 该属性将覆盖该选项
    if (tag.hasAttribute('autoplay')) {
      this.autoplay(true);
    } else {
      // 否则，使用setter来验证和设置正确的值。
      this.autoplay(this.options_.autoplay);
    }
    // check plugins、
    // 检查插件
    if (options.plugins) {
      Object.keys(options.plugins).forEach((name) => {
        if (typeof this[name] !== 'function') {
          throw new Error(`plugin "${name}" does not exist`);
        }
      });
    }

    /*
     * Store the internal state of scrubbing
     * 存储内部擦洗状态
     * @private
     * @return {Boolean} True if the user is scrubbing
     */
    this.scrubbing_ = false;

    this.el_ = this.createEl();

    // Make this an evented object and use `el_` as its event bus.
    // 将此对象设为事件对象并使用“el”作为其事件总线。
    evented(this, {eventBusKey: 'el_'});

    // listen to document and player fullscreenchange handlers so we receive those events
    // before a user can receive them so we can update isFullscreen appropriately.
    // 监听document和player fullscreenschange处理程序，以便在用户接收事件之前接收这些事件，以便我们可以适当地更新isFullscreen。
    // make sure that we listen to fullscreenchange events before everything else to make sure that
    // our isFullscreen method is updated properly for internal components as well as external.
    // 确保我们在做其他事情之前先听fullscreenchange事件，以确保我们的isFullscreen方法对内部组件和外部组件都进行了正确的更新。
    if (this.fsApi_.requestFullscreen) {
      Events.on(document, this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
      this.on(this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
    }

    if (this.fluid_) {
      this.on('playerreset', this.updateStyleEl_);
    }
    // We also want to pass the original player options to each component and plugin
    // as well so they don't need to reach back into the player for options later.
    // 我们还希望将原始播放器选项传递给每个组件和插件，这样他们就不需要再回到播放器中获取选项了。
    // We also need to do another copy of this.options_ so we don't end up with
    // an infinite loop.
    // 我们还需要再做一份this.options所以我们不会以无限循环结束。
    const playerOptionsCopy = mergeOptions(this.options_);

    // Load plugins
    // 加载插件
    if (options.plugins) {
      Object.keys(options.plugins).forEach((name) => {
        this[name](options.plugins[name]);
      });
    }

    // 启用调试模式以触发所有插件的debugon事件。
    if (options.debug) {
      this.debug(true);
    }

    this.options_.playerOptions = playerOptionsCopy;

    this.middleware_ = [];

    this.initChildren();

    // Set isAudio based on whether or not an audio tag was used
    // 根据是否使用了音频标记设置isAudio
    this.isAudio(tag.nodeName.toLowerCase() === 'audio');

    // Update controls className. Can't do this when the controls are initially
    // set because the element doesn't exist yet.
    // 更新控件类名。无法在控件初始设置时执行此操作，因为元素尚不存在。
    if (this.controls()) {
      this.addClass('vjs-controls-enabled');
    } else {
      this.addClass('vjs-controls-disabled');
    }

    // Set ARIA label and region role depending on player type
    // 根据player类型设置ARIA标签和区域角色
    this.el_.setAttribute('role', 'region');
    if (this.isAudio()) {
      this.el_.setAttribute('aria-label', this.localize('Audio Player'));
    } else {
      this.el_.setAttribute('aria-label', this.localize('Video Player'));
    }

    if (this.isAudio()) {
      this.addClass('vjs-audio');
    }

    if (this.flexNotSupported_()) {
      this.addClass('vjs-no-flex');
    }


    if (browser.TOUCH_ENABLED) {
      this.addClass('vjs-touch-enabled');
    }

    // iOS Safari has broken hover handling
    // iOS Safari中断了悬停处理
    if (!browser.IS_IOS) {
      this.addClass('vjs-workinghover');
    }

    // Make player easily findable by ID
    // 让player很容易依据id查找
    Player.players[this.id_] = this;

    // Add a major version class to aid css in plugins
    // 添加一个主版本类来帮助插件中的css
    const majorVersion = version.split('.')[0];

    this.addClass(`vjs-v${majorVersion}`);

    // When the player is first initialized, trigger activity so components
    // like the control bar show themselves if needed
    // 当播放器第一次初始化时，触发活动，以便控件栏等组件在需要时显示自己
    this.userActive(true);
    this.reportUserActivity();

    this.one('play', this.listenForUserActivity_);
    this.on('stageclick', this.handleStageClick_);
    this.on('keydown', this.handleKeyDown);
    this.on('languagechange', this.handleLanguagechange);

    this.breakpoints(this.options_.breakpoints);
    this.responsive(this.options_.responsive);
  }

  /**
   * Destroys the video player and does any necessary cleanup.
   * 销毁视频播放器并进行任何必要的清理。
   * This is especially helpful if you are dynamically adding and removing videos
   * to/from the DOM.
   * 如果要在DOM中动态添加和删除视频，这一点尤其有用。
   * @fires Player#dispose
   */
  dispose() {
    /**
     * Called when the player is being disposed of.
     * 在处理播放机时调用。
     * @event Player#dispose
     * @type {EventTarget~Event}
     */
    this.trigger('dispose');
    // prevent dispose from being called twice
    // 防止调用dispose两次
    this.off('dispose');

    // 确保所有特定于播放器的文档侦听器都已解除绑定。
    Events.off(document, this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
    Events.off(document, 'keydown', this.boundFullWindowOnEscKey_);

    if (this.styleEl_ && this.styleEl_.parentNode) {
      this.styleEl_.parentNode.removeChild(this.styleEl_);
      this.styleEl_ = null;
    }

    
    // Kill reference to this player
    // 删除对该播放器的引用
    Player.players[this.id_] = null;

    if (this.tag && this.tag.player) {
      this.tag.player = null;
    }

    if (this.el_ && this.el_.player) {
      this.el_.player = null;
    }

    if (this.tech_) {
      this.tech_.dispose();
      this.isPosterFromTech_ = false;
      this.poster_ = '';
    }

    if (this.playerElIngest_) {
      this.playerElIngest_ = null;
    }

    if (this.tag) {
      this.tag = null;
    }

    middleware.clearCacheForPlayer(this);

    // remove all event handlers for track lists
    // all tracks and track listeners are removed on
    // tech dispose
    // 删除跟踪列表的所有事件处理程序在tech dispose上删除所有跟踪和跟踪侦听器
    TRACK_TYPES.names.forEach((name) => {
      const props = TRACK_TYPES[name];
      const list = this[props.getterName]();

      // if it is not a native list
      // we have to manually remove event listeners
      // 如果不是本机列表，则必须手动删除事件侦听器
      if (list && list.off) {
        list.off();
      }
    });

    // the actual .el_ is removed here
    // 调用父类的销毁函数
    super.dispose();
  }

  /**
   * Create the `Player`'s DOM element.
   * 创建“Player”的DOM元素。
   * @return {Element}
   *         The DOM element that gets created.
   */
  createEl() {
    let tag = this.tag;
    let el;
    let playerElIngest = this.playerElIngest_ = tag.parentNode && tag.parentNode.hasAttribute && tag.parentNode.hasAttribute('data-vjs-player');
    const divEmbed = this.tag.tagName.toLowerCase() === 'video-js';

    if (playerElIngest) {
      el = this.el_ = tag.parentNode;
    } else if (!divEmbed) {
      el = this.el_ = super.createEl('div');
    }

    // Copy over all the attributes from the tag, including ID and class
    // ID will now reference player box, not the video tag
    // 复制标记中的所有属性，包括ID和class ID现在将引用player box，而不是video标记
    const attrs = Dom.getAttributes(tag);

    if (divEmbed) {
      el = this.el_ = tag;
      tag = this.tag = document.createElement('video');
      while (el.children.length) {
        tag.appendChild(el.firstChild);
      }

      if (!Dom.hasClass(el, 'video-js')) {
        Dom.addClass(el, 'video-js');
      }

      el.appendChild(tag);

      playerElIngest = this.playerElIngest_ = el;
      // move properties over from our custom `video-js` element
      // to our new `video` element. This will move things like
      // `src` or `controls` that were set via js before the player
      // was initialized.
      // 将属性从我们的自定义“video js”元素移到新的“video”元素。
      // 这将移动在初始化播放器之前通过js设置的“src”或“controls”。
      Object.keys(el).forEach((k) => {
        try {
          tag[k] = el[k];
        } catch (e) {

        }
      });
    }

    // set tabindex to -1 to remove the video element from the focus order
    // 将tabindex设置为-1以从焦点顺序中删除视频元素
    tag.setAttribute('tabindex', '-1');
    attrs.tabindex = '-1';


    if (IE_VERSION || (IS_CHROME && IS_WINDOWS)) {
      tag.setAttribute('role', 'application');
      attrs.role = 'application';
    }

    // Remove width/height attrs from tag so CSS can make it 100% width/height
    // 从标记中删除width/height属性，这样CSS就可以使其达到100%的宽度/高度
    tag.removeAttribute('width');
    tag.removeAttribute('height');

    if ('width' in attrs) {
      delete attrs.width;
    }
    if ('height' in attrs) {
      delete attrs.height;
    }

    Object.getOwnPropertyNames(attrs).forEach(function(attr) {
      // don't copy over the class attribute to the player element when we're in a div embed
      // the class is already set up properly in the divEmbed case
      // and we want to make sure that the `video-js` class doesn't get lost
      // 当我们在div embed中时，不要将class属性复制到player元素中，
      // 类已经在divEmbed中正确设置了，我们希望确保“video js”类不会丢失
      if (!(divEmbed && attr === 'class')) {
        el.setAttribute(attr, attrs[attr]);
      }

      if (divEmbed) {
        tag.setAttribute(attr, attrs[attr]);
      }
    });

    // Update tag id/class for use as HTML5 playback tech
    // Might think we should do this after embedding in container so .vjs-tech class
    // doesn't flash 100% width/height, but class only applies with .video-js parent
    tag.playerId = tag.id;
    // 更新标签id/class以用作HTML5回放技术可能认为我们应该在嵌入容器之后
    // 这样.vjs tech类不会100%地闪烁宽度/高度，但是类只适用于.video js parent
    tag.id += '_html5_api';
    tag.className = 'vjs-tech';

    // Make player findable on elements
    // 使player可以在元素上找到
    tag.player = el.player = this;
    // Default state of video is paused
    // 默认状态为暂停
    this.addClass('vjs-paused');

    // Add a style element in the player that we'll use to set the width/height
    // of the player in a way that's still overrideable by CSS, just like the
    // video element
    // 在播放器中添加一个style元素，我们将使用这个元素来设置播放器的宽度/高度，
    // 这种方式仍然可以被CSS覆盖，就像video元素一样
    if (window.VIDEOJS_NO_DYNAMIC_STYLE !== true) {
      this.styleEl_ = stylesheet.createStyleElement('vjs-styles-dimensions');
      const defaultsStyleEl = Dom.$('.vjs-styles-defaults');
      const head = Dom.$('head');

      head.insertBefore(this.styleEl_, defaultsStyleEl ? defaultsStyleEl.nextSibling : head.firstChild);
    }

    this.fill_ = false;
    this.fluid_ = false;

    // Pass in the width/height/aspectRatio options which will update the style el
    // 传入width/height/aspectRatio选项，该选项将更新样式el
    this.width(this.options_.width);
    this.height(this.options_.height);
    this.fill(this.options_.fill);
    this.fluid(this.options_.fluid);
    this.aspectRatio(this.options_.aspectRatio);
    // support both crossOrigin and crossorigin to reduce confusion and issues around the name
    // 同时支持crossOrigin和crossOrigin以减少名称的混淆和问题
    this.crossOrigin(this.options_.crossOrigin || this.options_.crossorigin);

    // Hide any links within the video/audio tag,
    // because IE doesn't hide them completely from screen readers.
    // 隐藏视频/音频标签中的任何链接，因为IE不会完全对屏幕阅读器隐藏它们。
    const links = tag.getElementsByTagName('a');

    for (let i = 0; i < links.length; i++) {
      const linkEl = links.item(i);

      Dom.addClass(linkEl, 'vjs-hidden');
      linkEl.setAttribute('hidden', 'hidden');
    }

    // insertElFirst seems to cause the networkState to flicker from 3 to 2, so
    // keep track of the original for later so we can know if the source originally failed
    // insertElFirst似乎会导致networkState从3闪烁到2，因此请跟踪原始数据以便稍后我们可以知道源是否失败
    tag.initNetworkState_ = tag.networkState;

    // Wrap video tag in div (el/box) container
    if (tag.parentNode && !playerElIngest) {
      tag.parentNode.insertBefore(el, tag);
    }

    // insert the tag as the first child of the player element
    // then manually add it to the children array so that this.addChild
    // will work properly for other components
    // 插入标记作为player元素的第一个子元素，然后手动将其添加到子数组中，
    // 以便这个.addChild对其他部件也能正常工作
    // Breaks iPhone, fixed in HTML5 setup.
    Dom.prependTo(tag, el);
    this.children_.unshift(tag);

    // Set lang attr on player to ensure CSS :lang() in consistent with player
    // 在player上设置lang attr以确保CSS:lang（）与player一致
    // if it's been set to something different to the doc
    // 如果它被设置成与文档不同的东西
    this.el_.setAttribute('lang', this.language_);

    this.el_ = el;

    return el;
  }

  /**
   * Get or set the `Player`'s crossOrigin option. For the HTML5 player, this
   * sets the `crossOrigin` property on the `<video>` tag to control the CORS
   * behavior.
   * 获取或设置“Player”的crossOrigin选项。对于HTML5播放器，这将在“<video>”标记上设置“crossOrigin”属性来控制CORS行为。
   * @see [Video Element Attributes]{@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-crossorigin}
   *
   * @param {string} [value]
   *        The value to set the `Player`'s crossOrigin to. If an argument is
   *        given, must be one of `anonymous` or `use-credentials`.
   *
   * @return {string|undefined}
   *         - The current crossOrigin value of the `Player` when getting.
   *         - undefined when setting
   */
  crossOrigin(value) {
    if (!value) {
      return this.techGet_('crossOrigin');
    }

    if (value !== 'anonymous' && value !== 'use-credentials') {
      log.warn(`crossOrigin must be "anonymous" or "use-credentials", given "${value}"`);
      return;
    }

    this.techCall_('setCrossOrigin', value);

    return;
  }

  /**
   * A getter/setter for the `Player`'s width. Returns the player's configured value.
   * To get the current width use `currentWidth()`.
   * “Player”宽度的getter/setter。返回播放器的配置值。要获取当前宽度，请使用“currentWidth（）”。
   * @param {number} [value]
   *        The value to set the `Player`'s width to.
   *        播放器的宽度
   * @return {number}
   *         The current width of the `Player` when getting.
   */
  width(value) {
    return this.dimension('width', value);
  }

  /**
   * A getter/setter for the `Player`'s height. Returns the player's configured value.
   * To get the current height use `currentheight()`.
   * player高度的一个固定器。返回播放器的配置值。要获取当前高度，请使用“currentheight（）”。
   *
   * @param {number} [value]
   *        The value to set the `Player`'s heigth to.
   *        播放器的目标高度
   * @return {number}
   *         The current height of the `Player` when getting.
   */
  height(value) {
    return this.dimension('height', value);
  }

  /**
   * A getter/setter for the `Player`'s width & height.
   * player宽度和高度的getter/setter。
   * @param {string} dimension
   *        This string can be:
   *        - 'width'
   *        - 'height'
   *
   * @param {number} [value]
   *        Value for dimension specified in the first argument.
   *        在第一个参数中指定的维度的值。
   * @return {number}
   *         The dimension arguments value when getting (width/height).
   */
  dimension(dimension, value) {
    const privDimension = dimension + '_';

    if (value === undefined) {
      return this[privDimension] || 0;
    }

    if (value === '' || value === 'auto') {
      // If an empty string is given, reset the dimension to be automatic
      // 如果给定空字符串，请将维度重置为自动
      this[privDimension] = undefined;
      this.updateStyleEl_();
      return;
    }

    const parsedVal = parseFloat(value);

    if (isNaN(parsedVal)) {
      log.error(`Improper value "${value}" supplied for for ${dimension}`);
      return;
    }

    this[privDimension] = parsedVal;
    this.updateStyleEl_();
  }

  /**
   * A getter/setter/toggler for the vjs-fluid `className` on the `Player`.
   * “Player”上的vjs流体“className”的getter/setter/toggler。
   * Turning this on will turn off fill mode.
   * 启用此选项将关闭填充模式。
   * @param {boolean} [bool]
   *        - A value of true adds the class.
   *        - A value of false removes the class.
   *        - No value will be a getter.
   *
   * @return {boolean|undefined}
   *         - The value of fluid when getting.
   *         - `undefined` when setting.
   */
  fluid(bool) {
    if (bool === undefined) {
      return !!this.fluid_;
    }

    this.fluid_ = !!bool;

    if (isEvented(this)) {
      this.off('playerreset', this.updateStyleEl_);
    }
    if (bool) {
      this.addClass('vjs-fluid');
      this.fill(false);
      addEventedCallback(function() {
        this.on('playerreset', this.updateStyleEl_);
      });
    } else {
      this.removeClass('vjs-fluid');
    }

    this.updateStyleEl_();
  }

  /**
   * A getter/setter/toggler for the vjs-fill `className` on the `Player`.
   * vjs在“Player”上填充“className”的getter/setter/toggler。
   * Turning this on will turn off fluid mode.
   *  启用此选项将关闭流体模式。
   * @param {boolean} [bool]
   *        - A value of true adds the class.
   *        - A value of false removes the class.
   *        - No value will be a getter.
   *
   * @return {boolean|undefined}
   *         - The value of fluid when getting.
   *         - `undefined` when setting.
   */
  fill(bool) {
    if (bool === undefined) {
      return !!this.fill_;
    }

    this.fill_ = !!bool;

    if (bool) {
      this.addClass('vjs-fill');
      this.fluid(false);
    } else {
      this.removeClass('vjs-fill');
    }
  }

  /**
   * Get/Set the aspect ratio
   * 获取/设置纵横比
   * @param {string} [ratio]
   *        Aspect ratio for player
   *
   * @return {string|undefined}
   *         returns the current aspect ratio when getting
   */

  /**
   * A getter/setter for the `Player`'s aspect ratio.
   * “Player”纵横比的getter/setter。
   * @param {string} [ratio]
   *        The value to set the `Player`'s aspect ratio to.
   *
   * @return {string|undefined}
   *         - The current aspect ratio of the `Player` when getting.
   *         - undefined when setting
   */
  aspectRatio(ratio) {
    if (ratio === undefined) {
      return this.aspectRatio_;
    }

    // Check for width:height format
    // 检查宽度：高度格式
    if (!(/^\d+\:\d+$/).test(ratio)) {
      throw new Error('Improper value supplied for aspect ratio. The format should be width:height, for example 16:9.');
    }
    this.aspectRatio_ = ratio;

    // We're assuming if you set an aspect ratio you want fluid mode,
    // because in fixed mode you could calculate width and height yourself.
    // 我们假设如果你设置一个宽高比你想要流体模式，因为在固定模式下你可以自己计算宽度和高度。
    this.fluid(true);

    this.updateStyleEl_();
  }

  /**
   * Update styles of the `Player` element (height, width and aspect ratio).
   * 更新“Player”元素的样式（高度、宽度和纵横比）。
   * @private
   * @listens Tech#loadedmetadata
   */
  updateStyleEl_() {
    if (window.VIDEOJS_NO_DYNAMIC_STYLE === true) {
      const width = typeof this.width_ === 'number' ? this.width_ : this.options_.width;
      const height = typeof this.height_ === 'number' ? this.height_ : this.options_.height;
      const techEl = this.tech_ && this.tech_.el();

      if (techEl) {
        if (width >= 0) {
          techEl.width = width;
        }
        if (height >= 0) {
          techEl.height = height;
        }
      }

      return;
    }

    let width;
    let height;
    let aspectRatio;
    let idClass;

    // The aspect ratio is either used directly or to calculate width and height.
    // 纵横比可以直接使用，也可以用于计算宽度和高度。
    if (this.aspectRatio_ !== undefined && this.aspectRatio_ !== 'auto') {
      // Use any aspectRatio that's been specifically set
      // 使用任何专门设置的aspectRatio
      aspectRatio = this.aspectRatio_;
    } else if (this.videoWidth() > 0) {
      // Otherwise try to get the aspect ratio from the video metadata
      // 否则，请尝试从视频元数据中获取纵横比
      aspectRatio = this.videoWidth() + ':' + this.videoHeight();
    } else {
      // Or use a default. The video element's is 2:1, but 16:9 is more common.
      // 或者使用默认值。视频元素是2:1，但是16:9更常见。
      aspectRatio = '16:9';
    }

    // Get the ratio as a decimal we can use to calculate dimensions
    // 我们可以用十进制来计算尺寸
    const ratioParts = aspectRatio.split(':');
    const ratioMultiplier = ratioParts[1] / ratioParts[0];

    if (this.width_ !== undefined) {
      // Use any width that's been specifically set
      // 使用任何指定的宽度
      width = this.width_;
    } else if (this.height_ !== undefined) {
      // Or calulate the width from the aspect ratio if a height has been set
      // 或根据纵横比计算宽度（如果已设置高度）
      width = this.height_ / ratioMultiplier;
    } else {
      // Or use the video's metadata, or use the video el's default of 300
      // 或者使用视频的元数据，或者使用视频el的默认值300
      width = this.videoWidth() || 300;
    }

    if (this.height_ !== undefined) {
      // Use any height that's been specifically set
      // 使用任何指定的高度
      height = this.height_;
    } else {
      // Otherwise calculate the height from the ratio and the width
      // 否则根据比率和宽度计算高度
      height = width * ratioMultiplier;
    }

    // Ensure the CSS class is valid by starting with an alpha character
    // 确保CSS类以字母字符开头是有效的
    if ((/^[^a-zA-Z]/).test(this.id())) {
      idClass = 'dimensions-' + this.id();
    } else {
      idClass = this.id() + '-dimensions';
    }

    // Ensure the right class is still on the player for the style element
    // 确保style元素的播放器上仍然有正确的类
    this.addClass(idClass);

    stylesheet.setTextContent(this.styleEl_, `
      .${idClass} {
        width: ${width}px;
        height: ${height}px;
      }

      .${idClass}.vjs-fluid {
        padding-top: ${ratioMultiplier * 100}%;
      }
    `);
  }

  /**
   * Load/Create an instance of playback {@link Tech} including element
   * and API methods. Then append the `Tech` element in `Player` as a child.
   * 加载/创建playback{@linktech}的实例，包括元素和API方法。然后将“Tech”元素作为子元素附加到“Player”中。
   * @param {string} techName
   *        name of the playback technology
   *
   * @param {string} source
   *        video source
   *
   * @private
   */
  loadTech_(techName, source) {

    // Pause and remove current playback technology
    // 暂停和删除当前播放技术
    if (this.tech_) {
      this.unloadTech_();
    }

    const titleTechName = toTitleCase(techName);
    const camelTechName = techName.charAt(0).toLowerCase() + techName.slice(1);

    // get rid of the HTML5 video tag as soon as we are using another tech
    // 一旦我们正在使用另一种技术，请尽快去掉HTML5视频标签
    if (titleTechName !== 'Html5' && this.tag) {
      Tech.getTech('Html5').disposeMediaElement(this.tag);
      this.tag.player = null;
      this.tag = null;
    }

    this.techName_ = titleTechName;

    // Turn off API access because we're loading a new tech that might load asynchronously
    // 关闭API访问，因为我们正在加载可能异步加载的新技术
    this.isReady_ = false;

    // if autoplay is a string we pass false to the tech
    // because the player is going to handle autoplay on `loadstart`
    // 如果autoplay是一个字符串，我们就把false传给TECH，因为播放器将在loadstart上处理autoplay`
    const autoplay = typeof this.autoplay() === 'string' ? false : this.autoplay();

    // Grab tech-specific options from player options and add source and parent element to use.
    // 从player options抓取特定于技术的选项，并添加要使用的源元素和父元素。
    const techOptions = {
      source,
      autoplay,
      'nativeControlsForTouch': this.options_.nativeControlsForTouch,
      'playerId': this.id(),
      'techId': `${this.id()}_${camelTechName}_api`,
      'playsinline': this.options_.playsinline,
      'preload': this.options_.preload,
      'loop': this.options_.loop,
      'disablePictureInPicture': this.options_.disablePictureInPicture,
      'muted': this.options_.muted,
      'poster': this.poster(),
      'language': this.language(),
      'playerElIngest': this.playerElIngest_ || false,
      'vtt.js': this.options_['vtt.js'],
      'canOverridePoster': !!this.options_.techCanOverridePoster,
      'enableSourceset': this.options_.enableSourceset,
      'Promise': this.options_.Promise
    };

    TRACK_TYPES.names.forEach((name) => {
      const props = TRACK_TYPES[name];

      techOptions[props.getterName] = this[props.privateName];
    });

    assign(techOptions, this.options_[titleTechName]);
    assign(techOptions, this.options_[camelTechName]);
    assign(techOptions, this.options_[techName.toLowerCase()]);

    if (this.tag) {
      techOptions.tag = this.tag;
    }

    if (source && source.src === this.cache_.src && this.cache_.currentTime > 0) {
      techOptions.startTime = this.cache_.currentTime;
    }

    // Initialize tech instance
    // 初始化技术实例
    const TechClass = Tech.getTech(techName);

    if (!TechClass) {
      throw new Error(`No Tech named '${titleTechName}' exists! '${titleTechName}' should be registered using videojs.registerTech()'`);
    }

    this.tech_ = new TechClass(techOptions);

    // player.triggerReady is always async, so don't need this to be async
    // player.triggerReady播放器不要总是异步的
    this.tech_.ready(Fn.bind(this, this.handleTechReady_), true);

    textTrackConverter.jsonToTextTracks(this.textTracksJson_ || [], this.tech_);

    // Listen to all HTML5-defined events and trigger them on the player
    // 监听所有HTML5定义的事件并在播放器上触发它们
    TECH_EVENTS_RETRIGGER.forEach((event) => {
      this.on(this.tech_, event, this[`handleTech${toTitleCase(event)}_`]);
    });

    Object.keys(TECH_EVENTS_QUEUE).forEach((event) => {
      this.on(this.tech_, event, (eventObj) => {
        if (this.tech_.playbackRate() === 0 && this.tech_.seeking()) {
          this.queuedCallbacks_.push({
            callback: this[`handleTech${TECH_EVENTS_QUEUE[event]}_`].bind(this),
            event: eventObj
          });
          return;
        }
        this[`handleTech${TECH_EVENTS_QUEUE[event]}_`](eventObj);
      });
    });

    this.on(this.tech_, 'loadstart', this.handleTechLoadStart_);
    this.on(this.tech_, 'sourceset', this.handleTechSourceset_);
    this.on(this.tech_, 'waiting', this.handleTechWaiting_);
    this.on(this.tech_, 'ended', this.handleTechEnded_);
    this.on(this.tech_, 'seeking', this.handleTechSeeking_);
    this.on(this.tech_, 'play', this.handleTechPlay_);
    this.on(this.tech_, 'firstplay', this.handleTechFirstPlay_);
    this.on(this.tech_, 'pause', this.handleTechPause_);
    this.on(this.tech_, 'durationchange', this.handleTechDurationChange_);
    this.on(this.tech_, 'fullscreenchange', this.handleTechFullscreenChange_);
    this.on(this.tech_, 'fullscreenerror', this.handleTechFullscreenError_);
    this.on(this.tech_, 'enterpictureinpicture', this.handleTechEnterPictureInPicture_);
    this.on(this.tech_, 'leavepictureinpicture', this.handleTechLeavePictureInPicture_);
    this.on(this.tech_, 'error', this.handleTechError_);
    this.on(this.tech_, 'loadedmetadata', this.updateStyleEl_);
    this.on(this.tech_, 'posterchange', this.handleTechPosterChange_);
    this.on(this.tech_, 'textdata', this.handleTechTextData_);
    this.on(this.tech_, 'ratechange', this.handleTechRateChange_);

    this.usingNativeControls(this.techGet_('controls'));

    if (this.controls() && !this.usingNativeControls()) {
      this.addTechControlsListeners_();
    }

    // Add the tech element in the DOM if it was not already there
    // Make sure to not insert the original video element if using Html5
    // 如果还没有在DOM中添加tech元素，请确保在使用Html5时不要插入原始视频元素
    if (this.tech_.el().parentNode !== this.el() && (titleTechName !== 'Html5' || !this.tag)) {
      Dom.prependTo(this.tech_.el(), this.el());
    }

    // Get rid of the original video tag reference after the first tech is loaded
    // 在加载第一项技术后去掉原始的视频标记引用
    if (this.tag) {
      this.tag.player = null;
      this.tag = null;
    }
  }

  /**
   * Unload and dispose of the current playback {@link Tech}.
   * 卸载并释放当前播放{@link Tech}。
   * @private
   */
  unloadTech_() {
    // Save the current text tracks so that we can reuse the same text tracks with the next tech
    // 保存当前的文本轨迹，以便我们可以在下一个技术中重用相同的文本轨迹
    TRACK_TYPES.names.forEach((name) => {
      const props = TRACK_TYPES[name];

      this[props.privateName] = this[props.getterName]();
    });
    this.textTracksJson_ = textTrackConverter.textTracksToJson(this.tech_);

    this.isReady_ = false;

    this.tech_.dispose();

    this.tech_ = false;

    if (this.isPosterFromTech_) {
      this.poster_ = '';
      this.trigger('posterchange');
    }

    this.isPosterFromTech_ = false;
  }

  /**
   * Return a reference to the current {@link Tech}.
   * 返回对当前{@link Tech}的引用。
   * It will print a warning by default about the danger of using the tech directly
   * but any argument that is passed in will silence the warning.
   * 默认情况下，它会打印一条关于直接使用该技术的危险性的警告，但是传入的任何参数都会使警告静默。
   * @param {*} [safety]
   *        Anything passed in to silence the warning
   *
   * @return {Tech}
   *         The Tech
   */
  tech(safety) {
    if (safety === undefined) {
      log.warn('Using the tech directly can be dangerous. I hope you know what you\'re doing.\n' +
        'See https://github.com/videojs/video.js/issues/2617 for more info.\n');
    }

    return this.tech_;
  }

  /**
   * Set up click and touch listeners for the playback element
   * 为回放元素设置点击式监听
   * - On desktops: a click on the video itself will toggle playback
   * - 在pc上：点击视频本身将切换播放
   * - On mobile devices: a click on the video toggles controls
   *   which is done by toggling the user state between active and
   *   inactive
   * - 在移动设备上：点击视频切换控件，通过在活动和非活动之间切换用户状态来完成
   * - A tap can signal that a user has become active or has become inactive
   *   e.g. a quick tap on an iPhone movie should reveal the controls. Another
   *   quick tap should hide them again (signaling the user is in an inactive
   *   viewing state)
   * - 轻触可以发出用户已激活或已不活动的信号
   * - In addition to this, we still want the user to be considered inactive after
   *   a few seconds of inactivity.
   * - 除此之外，我们仍然希望用户在几秒钟不活动后被认为是不活动的。
   *
   * > Note: the only part of iOS interaction we can't mimic with this setup
   * is a touch and hold on the video element counting as activity in order to
   * keep the controls showing, but that shouldn't be an issue. A touch and hold
   * on any controls will still keep the user active
   *
   * @private
   */
  addTechControlsListeners_() {
    // Make sure to remove all the previous listeners in case we are called multiple times.
    // 确保删除所有以前的侦听器，以防被多次调用
    this.removeTechControlsListeners_();

    // Some browsers (Chrome & IE) don't trigger a click on a flash swf, but do
    // trigger mousedown/up.
    // 有些浏览器（Chrome&IE）不会触发对flashswf的点击，但会触发mousedown/up。
    // http://stackoverflow.com/questions/1444562/javascript-onclick-event-over-flash-object
    // Any touch events are set to block the mousedown event from happening
    this.on(this.tech_, 'mouseup', this.handleTechClick_);
    this.on(this.tech_, 'dblclick', this.handleTechDoubleClick_);

    // If the controls were hidden we don't want that to change without a tap event
    // so we'll check if the controls were already showing before reporting user
    // activity
    // 如果控件是隐藏的，我们不希望在没有tap事件的情况下进行更改。因此，我们将在报告用户活动之前检查控件是否已经显示
    this.on(this.tech_, 'touchstart', this.handleTechTouchStart_);
    this.on(this.tech_, 'touchmove', this.handleTechTouchMove_);
    this.on(this.tech_, 'touchend', this.handleTechTouchEnd_);

    // The tap listener needs to come after the touchend listener because the tap
    // listener cancels out any reportedUserActivity when setting userActive(false)
    // tap侦听器需要在touchend侦听器之后，因为在设置userActive（false）时，tap侦听器会取消任何reportedUserActivity
    this.on(this.tech_, 'tap', this.handleTechTap_);
  }

  /**
   * Remove the listeners used for click and tap controls. This is needed for
   * toggling to controls disabled, where a tap/touch should do nothing.
   * 删除用于单击和点击控件的侦听器。这对于切换到禁用的控件是必需的，
   * 在这种情况下，轻触/触摸不应起任何作用。
   * @private
   */
  removeTechControlsListeners_() {
    // We don't want to just use `this.off()` because there might be other needed
    // listeners added by techs that extend this.
    // 我们不想仅仅使用`this.off（）`因为tech可能会添加其他需要的侦听器来扩展此功能。
    this.off(this.tech_, 'tap', this.handleTechTap_);
    this.off(this.tech_, 'touchstart', this.handleTechTouchStart_);
    this.off(this.tech_, 'touchmove', this.handleTechTouchMove_);
    this.off(this.tech_, 'touchend', this.handleTechTouchEnd_);
    this.off(this.tech_, 'mouseup', this.handleTechClick_);
    this.off(this.tech_, 'dblclick', this.handleTechDoubleClick_);
  }

  /**
   * Player waits for the tech to be ready
   * player等待技术准备就绪
   * @private
   */
  handleTechReady_() {
    this.triggerReady();

    // Keep the same volume as before
    // 保持原来的音量
    if (this.cache_.volume) {
      this.techCall_('setVolume', this.cache_.volume);
    }

    // Look if the tech found a higher resolution poster while loading
    // 看看tech在加载时是否发现了更高分辨率的海报
    this.handleTechPosterChange_();

    // Update the duration if available
    // 更新持续时间（如果可用）
    this.handleTechDurationChange_();
  }

  /**
   * Retrigger the `loadstart` event that was triggered by the {@link Tech}. This
   * function will also trigger {@link Player#firstplay} if it is the first loadstart
   * for a video.
   * 重新触发由{@link Tech}触发的“loadstart”事件。如果是视频的第一个loadstart，
   * 此函数还将触发{@linkplayer#firstplay}。
   * @fires Player#loadstart
   * @fires Player#firstplay
   * @listens Tech#loadstart
   * @private
   */
  handleTechLoadStart_() {
    // TODO: Update to use `emptied` event instead. See #1277.

    this.removeClass('vjs-ended');
    this.removeClass('vjs-seeking');

    // reset the error state
    // 重置错误状态
    this.error(null);

    // Update the duration
    // 更新持续时间
    this.handleTechDurationChange_();

    // If it's already playing we want to trigger a firstplay event now.
    // The firstplay event relies on both the play and loadstart events
    // which can happen in any order for a new source
    // 如果它已经在播放，我们现在要触发一个firstplay事件。
    // firstplay事件依赖于play和loadstart事件，对于一个新的源，它们可以以任何顺序发生
    if (!this.paused()) {
      /**
       * Fired when the user agent begins looking for media data
       * 当用户代理开始查找媒体数据时激发
       * @event Player#loadstart
       * @type {EventTarget~Event}
       */
      this.trigger('loadstart');
      this.trigger('firstplay');
    } else {
      // reset the hasStarted state
      // 重置hasStarted的状态
      this.hasStarted(false);
      this.trigger('loadstart');
    }

    // autoplay happens after loadstart for the browser,
    // so we mimic that behavior
    // 自动播放在浏览器的loadstart之后发生，所以我们模拟这种行为
    this.manualAutoplay_(this.autoplay());
  }

  /**
   * Handle autoplay string values, rather than the typical boolean
   * values that should be handled by the tech. Note that this is not
   * part of any specification. Valid values and what they do can be
   * found on the autoplay getter at Player#autoplay()
   * 处理自动播放字符串值，而不是技术人员应该处理的典型布尔值。请注意，这不是任何规范的一部分。
   * 有效值及其作用可以在Player\autoplay（）的autoplay getter上找到
   * @param {any} type zzf add
   * @return {any} zzf add
   *
   */
  manualAutoplay_(type) {
    if (!this.tech_ || typeof type !== 'string') {
      return;
    }

    const muted = () => {
      const previouslyMuted = this.muted();

      this.muted(true);

      const restoreMuted = () => {
        this.muted(previouslyMuted);
      };

      // restore muted on play terminatation
      // 播放结束时恢复静音
      this.playTerminatedQueue_.push(restoreMuted);

      const mutedPromise = this.play();

      if (!isPromise(mutedPromise)) {
        return;
      }

      return mutedPromise.catch(restoreMuted);
    };

    let promise;

    // if muted defaults to true
    // the only thing we can do is call play
    // 如果muted默认为true，我们只能调用play
    if (type === 'any' && this.muted() !== true) {
      promise = this.play();

      if (isPromise(promise)) {
        promise = promise.catch(muted);
      }
    } else if (type === 'muted' && this.muted() !== true) {
      promise = muted();
    } else {
      promise = this.play();
    }

    if (!isPromise(promise)) {
      return;
    }

    return promise.then(() => {
      this.trigger({type: 'autoplay-success', autoplay: type});
    }).catch((e) => {
      this.trigger({type: 'autoplay-failure', autoplay: type});
    });
  }

  /**
   * Update the internal source caches so that we return the correct source from
   * `src()`, `currentSource()`, and `currentSources()`.
   * 更新内部源缓存，以便从“src（）”、“currentSource（）”和“currentSources（）”返回正确的源。
   * > Note: `currentSources` will not be updated if the source that is passed in exists
   *         in the current `currentSources` cache.
   *
   *  >注意：如果传入的源存在于当前的“currentSources”缓存中，则不会更新“currentSources”。
   * @param {Tech~SourceObject} srcObj
   *        A string or object source to update our caches to.
   */
  updateSourceCaches_(srcObj = '') {

    let src = srcObj;
    let type = '';

    if (typeof src !== 'string') {
      src = srcObj.src;
      type = srcObj.type;
    }

    // make sure all the caches are set to default values
    // to prevent null checking
    // 确保所有缓存都设置为默认值，以防止空检查
    this.cache_.source = this.cache_.source || {};
    this.cache_.sources = this.cache_.sources || [];

    // try to get the type of the src that was passed in
    // 尝试获取传入的src的类型
    if (src && !type) {
      type = findMimetype(this, src);
    }

    // update `currentSource` cache always
    // 始终更新`currentSource`缓存
    this.cache_.source = mergeOptions({}, srcObj, {src, type});

    const matchingSources = this.cache_.sources.filter((s) => s.src && s.src === src);
    const sourceElSources = [];
    const sourceEls = this.$$('source');
    const matchingSourceEls = [];

    for (let i = 0; i < sourceEls.length; i++) {
      const sourceObj = Dom.getAttributes(sourceEls[i]);

      sourceElSources.push(sourceObj);

      if (sourceObj.src && sourceObj.src === src) {
        matchingSourceEls.push(sourceObj.src);
      }
    }

    //如果我们有匹配的源els但不匹配源，则当前源缓存不是最新的
    if (matchingSourceEls.length && !matchingSources.length) {
      this.cache_.sources = sourceElSources;
    // if we don't have matching source or source els set the
    // sources cache to the `currentSource` cache
    // 如果没有匹配的源或源els，请将源缓存设置为“currentSource”缓存
    } else if (!matchingSources.length) {
      this.cache_.sources = [this.cache_.source];
    }

    // 更新tech`src`缓存
    this.cache_.src = src;
  }

  /**
   * *EXPERIMENTAL* Fired when the source is set or changed on the {@link Tech}
   * causing the media element to reload.
   * 在{@link Tech}上设置或更改源时激发，导致媒体元素重新加载。
   * It will fire for the initial source and each subsequent source.
   * This event is a custom event from Video.js and is triggered by the {@link Tech}.
   * 它将为初始震源和每个后续震源激发。此事件是来自的自定义事件video.js并由{@link Tech}触发。
   * The event object for this event contains a `src` property that will contain the source
   * that was available when the event was triggered. This is generally only necessary if Video.js
   * is switching techs while the source was being changed.
   * 此事件的事件对象包含一个“src”属性，该属性将包含触发事件时可用的源。通常只有在以下情况下才有必要这样做video.js正在更改源时正在切换技术。
   * It is also fired when `load` is called on the player (or media element)
   * because the {@link https://html.spec.whatwg.org/multipage/media.html#dom-media-load|specification for `load`}
   * says that the resource selection algorithm needs to be aborted and restarted.
   * In this case, it is very likely that the `src` property will be set to the
   * empty string `""` to indicate we do not know what the source will be but
   * that it is changing.
   *
   * *This event is currently still experimental and may change in minor releases.*
   * __To use this, pass `enableSourceset` option to the player.__
   *
   * @event Player#sourceset
   * @type {EventTarget~Event}
   * @prop {string} src
   *                The source url available when the `sourceset` was triggered.
   *                It will be an empty string if we cannot know what the source is
   *                but know that the source will change.
   */
  /**
   * Retrigger the `sourceset` event that was triggered by the {@link Tech}.
   * @param {any} event zzf add
   *
   * @fires Player#sourceset
   * @listens Tech#sourceset
   * @private
   */
  handleTechSourceset_(event) {
    // only update the source cache when the source
    // was not updated using the player api
    // 仅在未使用player api更新源时更新源缓存
    if (!this.changingSrc_) {
      let updateSourceCaches = (src) => this.updateSourceCaches_(src);
      const playerSrc = this.currentSource().src;
      const eventSrc = event.src;

      // if we have a playerSrc that is not a blob, and a tech src that is a blob
      // 如果我们有一个不是blob的playerSrc和一个blob的tech src
      if (playerSrc && !(/^blob:/).test(playerSrc) && (/^blob:/).test(eventSrc)) {

        // if both the tech source and the player source were updated we assume
        // something like @videojs/http-streaming did the sourceset and skip updating the source cache.
        // 如果技术源和播放器源代码都更新了，我们假设类似@videojs/httpstreaming这样的东西对sourceset进行了设置，并跳过了源缓存的更新。
        if (!this.lastSource_ || (this.lastSource_.tech !== eventSrc && this.lastSource_.player !== playerSrc)) {
          updateSourceCaches = () => {};
        }
      }

      // update the source to the initial source right away
      // in some cases this will be empty string
      // 立即将源代码更新为初始源代码在某些情况下这将是空字符串
      updateSourceCaches(eventSrc);

      // if the `sourceset` `src` was an empty string
      // wait for a `loadstart` to update the cache to `currentSrc`.
      // If a sourceset happens before a `loadstart`, we reset the state
      // 如果“sourceset”是空字符串，请等待“loadstart”将缓存更新为“currentSrc”。
      // 如果sourceset发生在“loadstart”之前，我们将重置状态
      if (!event.src) {
        this.tech_.any(['sourceset', 'loadstart'], (e) => {
          // if a sourceset happens before a `loadstart` there
          // is nothing to do as this `handleTechSourceset_`
          // will be called again and this will be handled there.
          // 如果sourceset发生在“loadstart”之前，则无需执行任何操作，
          // 因为将再次调用此“handleTechSourceset”，并在那里进行处理。
          if (e.type === 'sourceset') {
            return;
          }

          const techSrc = this.techGet('currentSrc');

          this.lastSource_.tech = techSrc;
          this.updateSourceCaches_(techSrc);
        });
      }
    }
    this.lastSource_ = {player: this.currentSource().src, tech: event.src};

    this.trigger({
      src: event.src,
      type: 'sourceset'
    });
  }

  /**
   * Add/remove the vjs-has-started class
   * 添加/删除vjs has started类
   * @fires Player#firstplay
   *
   * @param {boolean} request
   *        - true: adds the class
   *        - false: remove the class
   *
   * @return {boolean}
   *         the boolean value of hasStarted_
   */
  hasStarted(request) {
    if (request === undefined) {
      // act as getter, if we have no request to change
      // 如果我们没有改变的要求，那就当做getter使用
      return this.hasStarted_;
    }

    if (request === this.hasStarted_) {
      return;
    }

    this.hasStarted_ = request;

    if (this.hasStarted_) {
      this.addClass('vjs-has-started');
      this.trigger('firstplay');
    } else {
      this.removeClass('vjs-has-started');
    }
  }

  /**
   * Fired whenever the media begins or resumes playback
   * 每当媒体开始或恢复播放时激发
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play}
   * @fires Player#play
   * @listens Tech#play
   * @private
   */
  handleTechPlay_() {
    this.removeClass('vjs-ended');
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');

    // hide the poster when the user hits play
    // 当用户点击播放时隐藏海报
    this.hasStarted(true);
    /**
     * Triggered whenever an {@link Tech#play} event happens. Indicates that
     * playback has started or resumed.
     * 每当{@link Tech{play}事件发生时触发。指示播放已开始或已恢复。
     * @event Player#play
     * @type {EventTarget~Event}
     */
    this.trigger('play');
  }

  /**
   * Retrigger the `ratechange` event that was triggered by the {@link Tech}.
   * 重新触发{@link Tech}触发的“ratechange”事件。
   * If there were any events queued while the playback rate was zero, fire
   * those events now.
   * 如果在播放速率为零时有任何事件排队，请立即触发这些事件。
   * @private
   * @method Player#handleTechRateChange_
   * @fires Player#ratechange
   * @listens Tech#ratechange
   */
  handleTechRateChange_() {
    if (this.tech_.playbackRate() > 0 && this.cache_.lastPlaybackRate === 0) {
      this.queuedCallbacks_.forEach((queued) => queued.callback(queued.event));
      this.queuedCallbacks_ = [];
    }
    this.cache_.lastPlaybackRate = this.tech_.playbackRate();
    /**
     * Fires when the playing speed of the audio/video is changed
     * 更改音频/视频的播放速度时激发
     * @event Player#ratechange
     * @type {event}
     */
    this.trigger('ratechange');
  }

  /**
   * Retrigger the `waiting` event that was triggered by the {@link Tech}.
   * 重新触发由{@link Tech}触发的“waiting”事件。
   * @fires Player#waiting
   * @listens Tech#waiting
   * @private
   */
  handleTechWaiting_() {
    this.addClass('vjs-waiting');
    /**
     * A readyState change on the DOM element has caused playback to stop.
     * 对DOM元素的readyState更改已导致播放停止。
     * @event Player#waiting
     * @type {EventTarget~Event}
     */
    this.trigger('waiting');

    // Browsers may emit a timeupdate event after a waiting event. In order to prevent
    // premature removal of the waiting class, wait for the time to change.
    // 浏览器可能在等待事件之后发出timeupdate事件。为了防止过早删除等待的班级，等待时间的改变。
    const timeWhenWaiting = this.currentTime();
    const timeUpdateListener = () => {
      if (timeWhenWaiting !== this.currentTime()) {
        this.removeClass('vjs-waiting');
        this.off('timeupdate', timeUpdateListener);
      }
    };

    this.on('timeupdate', timeUpdateListener);
  }

  /**
   * Retrigger the `canplay` event that was triggered by the {@link Tech}.
   * 重新触发由{@link Tech}触发的“canplay”事件。
   * > Note: This is not consistent between browsers. See #1351
   *
   * @fires Player#canplay
   * @listens Tech#canplay
   * @private
   */
  handleTechCanPlay_() {
    this.removeClass('vjs-waiting');
    /**
     * The media has a readyState of HAVE_FUTURE_DATA or greater.
     *
     * @event Player#canplay
     * @type {EventTarget~Event}
     */
    this.trigger('canplay');
  }

  /**
   * Retrigger the `canplaythrough` event that was triggered by the {@link Tech}.
   * 媒体的readyState为HAVE\u FUTURE_DATA或更高版本。
   * @fires Player#canplaythrough
   * @listens Tech#canplaythrough
   * @private
   */
  handleTechCanPlayThrough_() {
    this.removeClass('vjs-waiting');
    /**
     * The media has a readyState of HAVE_ENOUGH_DATA or greater. This means that the
     * entire media file can be played without buffering.
     * 媒体的readyState为“有足够的数据”或更高的数据。
     * 这意味着整个媒体文件可以在没有缓冲的情况下播放。
     * @event Player#canplaythrough
     * @type {EventTarget~Event}
     */
    this.trigger('canplaythrough');
  }

  /**
   * Retrigger the `playing` event that was triggered by the {@link Tech}.
   * 重新触发{@link Tech}触发的“playing”事件。
   * @fires Player#playing
   * @listens Tech#playing
   * @private
   */
  handleTechPlaying_() {
    this.removeClass('vjs-waiting');
    /**
     * The media is no longer blocked from playback, and has started playing.
     * 媒体不再被阻止播放，并且已开始播放。
     * @event Player#playing
     * @type {EventTarget~Event}
     */
    this.trigger('playing');
  }

  /**
   * Retrigger the `seeking` event that was triggered by the {@link Tech}.
   * 重新触发{@link Tech}触发的“seeking”事件。
   * @fires Player#seeking
   * @listens Tech#seeking
   * @private
   */
  handleTechSeeking_() {
    this.addClass('vjs-seeking');
    /**
     * Fired whenever the player is jumping to a new time
     * 每当玩家跳转到新的时间时被触发
     * @event Player#seeking
     * @type {EventTarget~Event}
     */
    this.trigger('seeking');
  }

  /**
   * Retrigger the `seeked` event that was triggered by the {@link Tech}.
   * 重新触发{@link Tech}触发的“seeked”事件。
   * @fires Player#seeked
   * @listens Tech#seeked
   * @private
   */
  handleTechSeeked_() {
    this.removeClass('vjs-seeking');
    this.removeClass('vjs-ended');
    /**
     * Fired when the player has finished jumping to a new time
     * 当玩家跳到一个新的时间后触发
     * @event Player#seeked
     * @type {EventTarget~Event}
     */
    this.trigger('seeked');
  }

  /**
   * Retrigger the `firstplay` event that was triggered by the {@link Tech}.
   * 重新触发{@link Tech}触发的“firstplay”事件。
   * @fires Player#firstplay
   * @listens Tech#firstplay
   * @deprecated As of 6.0 firstplay event is deprecated.
   *             As of 6.0 passing the `starttime` option to the player and the firstplay event are deprecated.
   * @private
   */
  handleTechFirstPlay_() {
    // If the first starttime attribute is specified
    // then we will start at the given offset in seconds
    // 如果指定了第一个starttime属性，那么我们将以秒为单位从给定的偏移量开始
    if (this.options_.starttime) {
      log.warn('Passing the `starttime` option to the player will be deprecated in 6.0');
      this.currentTime(this.options_.starttime);
    }

    this.addClass('vjs-has-started');
    /**
     * Fired the first time a video is played. Not part of the HLS spec, and this is
     * probably not the best implementation yet, so use sparingly. If you don't have a
     * reason to prevent playback, use `myPlayer.one('play');` instead.
     * 第一次播放视频时激发。不是HLS规范的一部分，而且这可能还不是最好的实现，所以要谨慎使用。
     * 如果您没有理由阻止播放，请使用`myPlayer.one（'play'）；`。
     * @event Player#firstplay
     * @deprecated As of 6.0 firstplay event is deprecated.
     * @type {EventTarget~Event}
     */
    this.trigger('firstplay');
  }

  /**
   * Retrigger the `pause` event that was triggered by the {@link Tech}.
   * 重新触发由{@link Tech}触发的“pause”事件。
   * @fires Player#pause
   * @listens Tech#pause
   * @private
   */
  handleTechPause_() {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    /**
     * Fired whenever the media has been paused
     * 每当媒体暂停时激发
     * @event Player#pause
     * @type {EventTarget~Event}
     */
    this.trigger('pause');
  }

  /**
   * Retrigger the `ended` event that was triggered by the {@link Tech}.
   * 重新触发由{@link Tech}触发的“ended”事件。
   * @fires Player#ended
   * @listens Tech#ended
   * @private
   */
  handleTechEnded_() {
    this.addClass('vjs-ended');
    if (this.options_.loop) {
      this.currentTime(0);
      this.play();
    } else if (!this.paused()) {
      this.pause();
    }

    /**
     * Fired when the end of the media resource is reached (currentTime == duration)
     * 到达媒体资源结尾时激发
     * @event Player#ended
     * @type {EventTarget~Event}
     */
    this.trigger('ended');
  }

  /**
   * Fired when the duration of the media resource is first known or changed
   * 在首次知道或更改媒体资源的持续时间时激发
   * @listens Tech#durationchange
   * @private
   */
  handleTechDurationChange_() {
    this.duration(this.techGet_('duration'));
  }

  /**
   * Handle a click on the media element to play/pause
   * 点击媒体元素播放/暂停
   * @param {EventTarget~Event} event
   *        the event that caused this function to trigger
   *
   * @listens Tech#mouseup
   * @private
   */
  handleTechClick_(event) {
    if (!Dom.isSingleLeftClick(event)) {
      return;
    }

    // When controls are disabled a click should not toggle playback because
    // the click is considered a control
    // 禁用控件时，单击不应切换播放，因为单击被视为控件
    if (!this.controls_) {
      return;
    }

    if (this.paused()) {
      silencePromise(this.play());
    } else {
      this.pause();
    }
  }

  /**
   * Handle a double-click on the media element to enter/exit fullscreen
   * 当发生双击事件时切换全屏状态
   * @param {EventTarget~Event} event
   *        the event that caused this function to trigger
   *
   * @listens Tech#dblclick
   * @private
   */
  handleTechDoubleClick_(event) {
    if (!this.controls_) {
      return;
    }

    // we do not want to toggle fullscreen state
    // when double-clicking inside a control bar or a modal
    // 我们不想在双击控制栏或模态时切换全屏状态
    const inAllowedEls = Array.prototype.some.call(
      this.$$('.vjs-control-bar, .vjs-modal-dialog'),
      el => el.contains(event.target)
    );

    if (!inAllowedEls) {
      /*
       * options.userActions.doubleClick
       *
       * 
       * 如果“undefined”或“true”，则双击可在存在控件时全屏切换
       * Set to `false` to disable double-click handling
       * Set to a function to substitute an external double-click handler
       */
      if (
        this.options_ === undefined ||
        this.options_.userActions === undefined ||
        this.options_.userActions.doubleClick === undefined ||
        this.options_.userActions.doubleClick !== false
      ) {

        if (
          this.options_ !== undefined &&
          this.options_.userActions !== undefined &&
          typeof this.options_.userActions.doubleClick === 'function'
        ) {

          this.options_.userActions.doubleClick.call(this, event);

        } else if (this.isFullscreen()) {
          this.exitFullscreen();
        } else {
          this.requestFullscreen();
        }
      }
    }
  }

  /**
   * Handle a tap on the media element. It will toggle the user
   * activity state, which hides and shows the controls.
   * 轻触媒体元素。它将切换用户活动状态，该状态隐藏并显示控件。
   * @listens Tech#tap
   * @private
   */
  handleTechTap_() {
    this.userActive(!this.userActive());
  }

  /**
   * Handle touch to start
   * 点击时开始播放
   * @listens Tech#touchstart
   * @private
   */
  handleTechTouchStart_() {
    this.userWasActive = this.userActive();
  }

  /**
   * Handle touch to move
   * 监听滑动事件
   * @listens Tech#touchmove
   * @private
   */
  handleTechTouchMove_() {
    if (this.userWasActive) {
      this.reportUserActivity();
    }
  }

  /**
   * Handle touch to end
   * 监听滑动到视频接收
   * @param {EventTarget~Event} event
   *        the touchend event that triggered
   *        this function
   *
   * @listens Tech#touchend
   * @private
   */
  handleTechTouchEnd_(event) {
    // Stop the mouse events from also happening
    // 阻止鼠标事件同时发生
    event.preventDefault();
  }

  /**
   * native click events on the SWF aren't triggered on IE11, Win8.1RT
   * use stageclick events triggered from inside the SWF instead
   * SWF上的原生点击事件不会在IE11上触发，Win8.1RT使用从SWF内部触发的stageclick事件
   * @private
   * @listens stageclick
   */
  handleStageClick_() {
    this.reportUserActivity();
  }

  /**
   * @private
   */
  toggleFullscreenClass_() {
    if (this.isFullscreen()) {
      this.addClass('vjs-fullscreen');
    } else {
      this.removeClass('vjs-fullscreen');
    }
  }

  /**
   * when the document fschange event triggers it calls this
   * 当文档fschange事件触发时，调用这个函数
   * @param {any} e zzf add
   */
  documentFullscreenChange_(e) {
    const targetPlayer = e.target.player;

    // 如果另一个播放器是全屏的，那么对targetPlayer做一个空检查，因为旧版的firefox会将文档作为e.target
    if (targetPlayer && targetPlayer !== this) {
      return;
    }

    const el = this.el();
    let isFs = document[this.fsApi_.fullscreenElement] === el;

    if (!isFs && el.matches) {
      isFs = el.matches(':' + this.fsApi_.fullscreen);
    } else if (!isFs && el.msMatchesSelector) {
      isFs = el.msMatchesSelector(':' + this.fsApi_.fullscreen);
    }

    this.isFullscreen(isFs);
  }

  /**
   * Handle Tech Fullscreen Change
   * 处理全屏状态更改
   * @param {EventTarget~Event} event
   *        the fullscreenchange event that triggered this function
   *
   * @param {Object} data
   *        the data that was sent with the event
   *
   * @private
   * @listens Tech#fullscreenchange
   * @fires Player#fullscreenchange
   */
  handleTechFullscreenChange_(event, data) {
    if (data) {
      if (data.nativeIOSFullscreen) {
        this.toggleClass('vjs-ios-native-fs');
      }
      this.isFullscreen(data.isFullscreen);
    }
  }

  handleTechFullscreenError_(event, err) {
    this.trigger('fullscreenerror', err);
  }

  /**
   * @private
   */
  togglePictureInPictureClass_() {
    if (this.isInPictureInPicture()) {
      this.addClass('vjs-picture-in-picture');
    } else {
      this.removeClass('vjs-picture-in-picture');
    }
  }

  /**
   * Handle Tech Enter Picture-in-Picture.
   * 处理画中画状态。
   * @param {EventTarget~Event} event
   *        the enterpictureinpicture event that triggered this function
   *
   * @private
   * @listens Tech#enterpictureinpicture
   */
  handleTechEnterPictureInPicture_(event) {
    this.isInPictureInPicture(true);
  }

  /**
   * Handle Tech Leave Picture-in-Picture.
   * 处理退出画中画
   * @param {EventTarget~Event} event
   *        the leavepictureinpicture event that triggered this function
   *
   * @private
   * @listens Tech#leavepictureinpicture
   */
  handleTechLeavePictureInPicture_(event) {
    this.isInPictureInPicture(false);
  }

  /**
   * Fires when an error occurred during the loading of an audio/video.
   * 在加载音频/视频期间发生错误时激发。
   * @private
   * @listens Tech#error
   */
  handleTechError_() {
    const error = this.tech_.error();

    this.error(error);
  }

  /**
   * Retrigger the `textdata` event that was triggered by the {@link Tech}.
   * 重新触发{@link Tech}触发的“textdata”事件。
   * @fires Player#textdata
   * @listens Tech#textdata
   * @private
   */
  handleTechTextData_() {
    let data = null;

    if (arguments.length > 1) {
      data = arguments[1];
    }

    /**
     * Fires when we get a textdata event from tech
     * 当我们从tech获取textdata事件时激发
     * @event Player#textdata
     * @type {EventTarget~Event}
     */
    this.trigger('textdata', data);
  }

  /**
   * Get object for cached values.
   * 获取cache中的对象
   * @return {Object}
   *         get the current object cache
   */
  getCache() {
    return this.cache_;
  }

  /**
   * Resets the internal cache object.
   * 重置内部缓存对象。
   * Using this function outside the player constructor or reset method may
   * have unintended side-effects.
   * 在播放器构造函数或reset方法之外使用此函数可能会产生意外的副作用。
   * @private
   */
  resetCache_() {
    this.cache_ = {


      currentTime: 0,
      initTime: 0,
      inactivityTimeout: this.options_.inactivityTimeout,
      duration: NaN,
      lastVolume: 1,
      lastPlaybackRate: this.defaultPlaybackRate(),
      media: null,
      src: '',
      source: {},
      sources: [],
      volume: 1
    };
  }

  /**
   * Pass values to the playback tech
   * 将值传递给回放技术
   * @param {string} [method]
   *        the method to call
   *
   * @param {Object} arg
   *        the argument to pass
   *
   * @private
   */
  techCall_(method, arg) {
    // If it's not ready yet, call method when it is
    // 如果它还没有准备好，请在它准备好的时候调用方法
    this.ready(function() {
      if (method in middleware.allowedSetters) {
        return middleware.set(this.middleware_, this.tech_, method, arg);

      } else if (method in middleware.allowedMediators) {
        return middleware.mediate(this.middleware_, this.tech_, method, arg);
      }

      try {
        if (this.tech_) {
          this.tech_[method](arg);
        }
      } catch (e) {
        log(e);
        throw e;
      }
    }, true);
  }

  /**
   * Get calls can't wait for the tech, and sometimes don't need to.
   * 请求调用时不能等tech，有时也不需要。
   * @param {string} method
   *        Tech method
   *
   * @return {Function|undefined}
   *         the method or undefined
   *
   * @private
   */
  techGet_(method) {
    if (!this.tech_ || !this.tech_.isReady_) {
      return;
    }

    if (method in middleware.allowedGetters) {
      return middleware.get(this.middleware_, this.tech_, method);

    } else if (method in middleware.allowedMediators) {
      return middleware.mediate(this.middleware_, this.tech_, method);
    }

    // Flash likes to die and reload when you hide or reposition it.
    // 当你隐藏或重新定位它时，Flash会销毁并重新加载。
    // In these cases the object methods go away and we get errors.
    // 在这些情况下，对象方法消失了，我们得到了错误。
    // When that happens we'll catch the errors and inform tech that it's not ready any more.
    // 当这种情况发生时，我们会发现错误并通知tech它还没有准备好。
    try {
      return this.tech_[method]();
    } catch (e) {

      // When building additional tech libs, an expected method may not be defined yet
      // 在构建额外的技术库时，可能还没有定义预期的方法
      if (this.tech_[method] === undefined) {
        log(`Video.js: ${method} method not defined for ${this.techName_} playback technology.`, e);
        throw e;
      }

      // When a method isn't available on the object it throws a TypeError
      // 当对象上的方法不可用时，它将抛出一个TypeError
      if (e.name === 'TypeError') {
        log(`Video.js: ${method} unavailable on ${this.techName_} playback technology element.`, e);
        this.tech_.isReady_ = false;
        throw e;
      }

      // If error unknown, just log and throw
      // 如果错误未知，只需记录并抛出
      log(e);
      throw e;
    }
  }

  /**
   * Attempt to begin playback at the first opportunity.
   * 尝试在第一时间开始播放。
   * @return {Promise|undefined}
   *         Returns a promise if the browser supports Promises (or one
   *         was passed in as an option). This promise will be resolved on
   *         the return value of play. If this is undefined it will fulfill the
   *         promise chain otherwise the promise chain will be fulfilled when
   *         the promise from play is fulfilled.
   *        如果浏览器支持承诺（或作为选项传入），则返回承诺。这个承诺将在游戏的回报价值上得到解决。
   *        如果这是未定义的，它将实现承诺链，否则当游戏中的承诺实现时，承诺链将实现。
   */
  play() {
    const PromiseClass = this.options_.Promise || window.Promise;

    if (PromiseClass) {
      return new PromiseClass((resolve) => {
        this.play_(resolve);
      });
    }

    return this.play_();
  }

  /**
   * The actual logic for play, takes a callback that will be resolved on the
   * return value of play. This allows us to resolve to the play promise if there
   * is one on modern browsers.
   * play的实际逻辑接受一个回调，该回调将在play的返回值上解析。这使我们能够解决的发挥承诺，如果有一个在现代浏览器。
   * @private
   * @param {Function} [callback]
   *        The callback that should be called when the techs play is actually called
   */
  play_(callback = silencePromise) {
    this.playCallbacks_.push(callback);

    const isSrcReady = Boolean(!this.changingSrc_ && (this.src() || this.currentSrc()));

    // treat calls to play_ somewhat like the `one` event function
    // 将要播放的调用视为“one”事件函数
    if (this.waitToPlay_) {
      this.off(['ready', 'loadstart'], this.waitToPlay_);
      this.waitToPlay_ = null;
    }

    // if the player/tech is not ready or the src itself is not ready
    // queue up a call to play on `ready` or `loadstart`
    // 如果播放机/技术没有准备好或者src本身还没有准备好，请在“ready”或“loadstart”上排队播放`
    if (!this.isReady_ || !isSrcReady) {
      this.waitToPlay_ = (e) => {
        this.play_();
      };
      this.one(['ready', 'loadstart'], this.waitToPlay_);

      // if we are in Safari, there is a high chance that loadstart will trigger after the gesture timeperiod
      // in that case, we need to prime the video element by calling load so it'll be ready in time
      // 如果我们在Safari中，loadstart很有可能会在手势时间段后触发，
      // 在这种情况下，我们需要通过调用load来初始化视频元素，以便及时准备好
      if (!isSrcReady && (browser.IS_ANY_SAFARI || browser.IS_IOS)) {
        this.load();
      }
      return;
    }

    // If the player/tech is ready and we have a source, we can attempt playback.
    // 如果播放器/技术已经准备好，并且我们有一个源，我们可以尝试播放。
    const val = this.techGet_('play');

    // play was terminated if the returned value is null
    // 如果返回的值为空，则结束播放
    if (val === null) {
      this.runPlayTerminatedQueue_();
    } else {
      this.runPlayCallbacks_(val);
    }
  }

  /**
   * These functions will be run when if play is terminated. If play
   * runPlayCallbacks_ is run these function will not be run. This allows us
   * to differenciate between a terminated play and an actual call to play.
   * 如果播放终止，这些函数将运行。如果这些runbacks函数不运行，
   * 将运行这些回调函数。这允许我们区分终止的播放和实际的播放调用。
   */
  runPlayTerminatedQueue_() {
    const queue = this.playTerminatedQueue_.slice(0);

    this.playTerminatedQueue_ = [];

    queue.forEach(function(q) {
      q();
    });
  }

  /**
   * When a callback to play is delayed we have to run these
   * callbacks when play is actually called on the tech. This function
   * runs the callbacks that were delayed and accepts the return value
   * from the tech.
   * 当要播放的回调被延迟时，我们必须在技术上实际调用play时运行这些回调。
   * 这个函数运行延迟的回调并接受来自tech的返回值
   * @param {undefined|Promise} val
   *        The return value from the tech.
   */
  runPlayCallbacks_(val) {
    const callbacks = this.playCallbacks_.slice(0);

    this.playCallbacks_ = [];
    // clear play terminatedQueue since we finished a real play
    // 清除播放结束队列，因为我们完成了一个真正的播放
    this.playTerminatedQueue_ = [];

    callbacks.forEach(function(cb) {
      cb(val);
    });
  }

  /**
   * Pause the video playback
   * 暂停视频播放
   */
  pause() {
    this.techCall_('pause');
  }

  /**
   * Check if the player is paused or has yet to play
   * 检查播放器是否暂停或尚未播放
   * @return {boolean}
   *         - false: if the media is currently playing
   *         - true: if media is not currently playing
   */
  paused() {
    // The initial state of paused should be true (in Safari it's actually false)
    // paused的初始状态应该是true（在Safari中它实际上是false）
    return (this.techGet_('paused') === false) ? false : true;
  }

  /**
   * Get a TimeRange object representing the current ranges of time that the user
   * has played.
   * 获取一个TimeRange对象，该对象表示用户当前播放的时间范围。
   * @return {TimeRange}
   *         A time range object that represents all the increments of time that have
   *         been played.
   */
  played() {
    return this.techGet_('played') || createTimeRange(0, 0);
  }

  /**
   * Returns whether or not the user is "scrubbing". Scrubbing is
   * when the user has clicked the progress bar handle and is
   * dragging it along the progress bar.
   * 返回用户是否正在“scrubbing”。清理是指用户单击进度条句柄并沿着进度条拖动它
   * @param {boolean} [isScrubbing]
   *        whether the user is or is not scrubbing
   *
   * @return {boolean}
   *         The value of scrubbing when getting
   */
  scrubbing(isScrubbing) {
    if (typeof isScrubbing === 'undefined') {
      return this.scrubbing_;
    }
    this.scrubbing_ = !!isScrubbing;
    this.techCall_('setScrubbing', this.scrubbing_);

    if (isScrubbing) {
      this.addClass('vjs-scrubbing');
    } else {
      this.removeClass('vjs-scrubbing');
    }
  }

  /**
   * Get or set the current time (in seconds)
   * 获取或设置当前时间（秒）
   * @param {number|string} [seconds]
   *        The time to seek to in seconds
   *
   * @return {number}
   *         - the current time in seconds when getting
   */
  currentTime(seconds) {
    if (typeof seconds !== 'undefined') {
      if (seconds < 0) {
        seconds = 0;
      }
      if (!this.isReady_ || this.changingSrc_ || !this.tech_ || !this.tech_.isReady_) {
        this.cache_.initTime = seconds;
        this.off('canplay', this.applyInitTime_);
        this.one('canplay', this.applyInitTime_);
        return;
      }
      this.techCall_('setCurrentTime', seconds);
      this.cache_.initTime = 0;
      return;
    }

    // cache last currentTime and return. default to 0 seconds
    // 缓存上次currentTime并返回。默认为0秒
    this.cache_.currentTime = (this.techGet_('currentTime') || 0);
    return this.cache_.currentTime;
  }

  /**
   * Apply the value of initTime stored in cache as currentTime.
   * 将缓存中存储的initTime值应用为currentTime。
   * @private
   */
  applyInitTime_() {
    this.currentTime(this.cache_.initTime);
  }

  /**
   * Normally gets the length in time of the video in seconds;
   * in all but the rarest use cases an argument will NOT be passed to the method
   * 通常以秒为单位获取视频的时间长度；除极少数用例外，所有情况下都不会将参数传递给方法
   * > **NOTE**: The video must have started loading before the duration can be
   * known, and in the case of Flash, may not be known until the video starts
   * playing.
   * 视频必须在持续时间已知之前开始加载，如果是Flash，则可能在视频开始播放之前才知道。
   * @fires Player#durationchange
   *
   * @param {number} [seconds]
   *        The duration of the video to set in seconds
   *
   * @return {number}
   *         - The duration of the video in seconds when getting
   */
  duration(seconds) {
    if (seconds === undefined) {
      // return NaN if the duration is not known
      // 如果持续时间未知，则返回NaN
      return this.cache_.duration !== undefined ? this.cache_.duration : NaN;
    }

    seconds = parseFloat(seconds);

    // Standardize on Infinity for signaling video is live
    // 无限标准化视频直播信号
    if (seconds < 0) {
      seconds = Infinity;
    }

    if (seconds !== this.cache_.duration) {
      // Cache the last set value for optimized scrubbing (esp. Flash)
      // 缓存上次设置的值以进行优化清理（尤其是闪存）
      this.cache_.duration = seconds;

      if (seconds === Infinity) {
        this.addClass('vjs-live');
      } else {
        this.removeClass('vjs-live');
      }
      if (!isNaN(seconds)) {
        // Do not fire durationchange unless the duration value is known.
        // 除非知道duration值，否则不要激发durationchange。
        // @see [Spec]{@link https://www.w3.org/TR/2011/WD-html5-20110113/video.html#media-element-load-algorithm}

        /**
         * @event Player#durationchange
         * @type {EventTarget~Event}
         */
        this.trigger('durationchange');
      }
    }
  }

  /**
   * Calculates how much time is left in the video. Not part
   * of the native video API.
   * 计算视频中还剩多少时间。不是本机视频API的一部分。
   * @return {number}
   *         The time remaining in seconds
   */
  remainingTime() {
    return this.duration() - this.currentTime();
  }

  /**
   * A remaining time function that is intented to be used when
   * the time is to be displayed directly to the user.
   * 当时间要直接显示给用户时，打算使用的剩余时间函数。
   * @return {number}
   *         The rounded time remaining in seconds
   */
  remainingTimeDisplay() {
    return Math.floor(this.duration()) - Math.floor(this.currentTime());
  }

  // 有点像是已经下载的视频片段的数组。
  // Kind of like an array of portions of the video that have been downloaded.

  /**
   * Get a TimeRange object with an array of the times of the video
   * that have been downloaded. If you just want the percent of the
   * video that's been downloaded, use bufferedPercent.
   * 获取一个TimeRange对象，其中包含已下载视频的时间数组。
   * 如果您只需要下载视频的百分比，请使用bufferedPercent。
   * @see [Buffered Spec]{@link http://dev.w3.org/html5/spec/video.html#dom-media-buffered}
   *
   * @return {TimeRange}
   *         A mock TimeRange object (following HTML spec)
   */
  buffered() {
    let buffered = this.techGet_('buffered');

    if (!buffered || !buffered.length) {
      buffered = createTimeRange(0, 0);
    }

    return buffered;
  }

  /**
   * Get the percent (as a decimal) of the video that's been downloaded.
   * This method is not a part of the native HTML video API.
   * 获取已下载视频的百分比（十进制）。此方法不是本机HTML视频API的一部分。
   * @return {number}
   *         A decimal between 0 and 1 representing the percent
   *         that is buffered 0 being 0% and 1 being 100%
   */
  bufferedPercent() {
    return bufferedPercent(this.buffered(), this.duration());
  }

  /**
   * Get the ending time of the last buffered time range
   * This is used in the progress bar to encapsulate all time ranges.
   * 获取最后一个缓冲时间范围的结束时间。它在进度条中用于封装所有时间范围。
   * @return {number}
   *         The end of the last buffered time range
   */
  bufferedEnd() {
    const buffered = this.buffered();
    const duration = this.duration();
    let end = buffered.end(buffered.length - 1);

    if (end > duration) {
      end = duration;
    }

    return end;
  }

  /**
   * Get or set the current volume of the media
   * 获取或设置媒体的当前音量
   * @param  {number} [percentAsDecimal]
   *         The new volume as a decimal percent:
   *         - 0 is muted/0%/off
   *         - 1.0 is 100%/full
   *         - 0.5 is half volume or 50%
   *
   * @return {number}
   *         The current volume as a percent when getting
   */
  volume(percentAsDecimal) {
    let vol;

    if (percentAsDecimal !== undefined) {
      // Force value to between 0 and 1
      // 强制值介于0和1之间
      vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal)));
      this.cache_.volume = vol;
      this.techCall_('setVolume', vol);

      if (vol > 0) {
        this.lastVolume_(vol);
      }

      return;
    }

    // Default to 1 when returning current volume.
    // 返回当前卷时默认为1。
    vol = parseFloat(this.techGet_('volume'));
    return (isNaN(vol)) ? 1 : vol;
  }

  /**
   * Get the current muted state, or turn mute on or off
   * 获取当前静音状态，或打开或关闭静音
   * @param {boolean} [muted]
   *        - true to mute
   *        - false to unmute
   *
   * @return {boolean}
   *         - true if mute is on and getting
   *         - false if mute is off and getting
   */
  muted(muted) {
    if (muted !== undefined) {
      this.techCall_('setMuted', muted);
      return;
    }
    return this.techGet_('muted') || false;
  }

  /**
   * Get the current defaultMuted state, or turn defaultMuted on or off. defaultMuted
   * indicates the state of muted on initial playback.
   * 获取当前的defaultMuted状态，或启用或禁用defaultMuted。defaultMuted指示初始播放时的静音状态。
   * ```js
   *   var myPlayer = videojs('some-player-id');
   *
   *   myPlayer.src("http://www.example.com/path/to/video.mp4");
   *
   *   // get, should be false
   *   console.log(myPlayer.defaultMuted());
   *   // set to true
   *   myPlayer.defaultMuted(true);
   *   // get should be true
   *   console.log(myPlayer.defaultMuted());
   * ```
   *
   * @param {boolean} [defaultMuted]
   *        - true to mute
   *        - false to unmute
   *
   * @return {boolean|Player}
   *         - true if defaultMuted is on and getting
   *         - false if defaultMuted is off and getting
   *         - A reference to the current player when setting
   */
  defaultMuted(defaultMuted) {
    if (defaultMuted !== undefined) {
      return this.techCall_('setDefaultMuted', defaultMuted);
    }
    return this.techGet_('defaultMuted') || false;
  }

  /**
   * Get the last volume, or set it
   * 获取上一个音量，或者设置它
   * @param  {number} [percentAsDecimal]
   *         The new last volume as a decimal percent:
   *         - 0 is muted/0%/off
   *         - 1.0 is 100%/full
   *         - 0.5 is half volume or 50%
   *
   * @return {number}
   *         the current value of lastVolume as a percent when getting
   *
   * @private
   */
  lastVolume_(percentAsDecimal) {
    if (percentAsDecimal !== undefined && percentAsDecimal !== 0) {
      this.cache_.lastVolume = percentAsDecimal;
      return;
    }
    return this.cache_.lastVolume;
  }

  /**
   * Check if current tech can support native fullscreen
   * 检查当前技术是否支持本机全屏
   * (e.g. with built in controls like iOS, so not our flash swf)
   *
   * @return {boolean}
   *         if native fullscreen is supported
   */
  supportsFullScreen() {
    return this.techGet_('supportsFullScreen') || false;
  }

  /**
   * Check if the player is in fullscreen mode or tell the player that it
   * is or is not in fullscreen mode.
   * 检查播放机是否处于全屏模式，或告诉播放机是否处于全屏模式。
   * > NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
   * property and instead document.fullscreenElement is used. But isFullscreen is
   * still a valuable property for internal player workings.
   * 在最新的HTML5规范中，isFullscreen不再是官方属性，而是文档.fullscreenElement被使用。
   * 但是isFullscreen对于内部玩家来说仍然是一个很有价值的属性。
   * @param  {boolean} [isFS]
   *         Set the players current fullscreen state
   *
   * @return {boolean}
   *         - true if fullscreen is on and getting
   *         - false if fullscreen is off and getting
   */
  isFullscreen(isFS) {
    if (isFS !== undefined) {
      const oldValue = this.isFullscreen_;

      this.isFullscreen_ = Boolean(isFS);

      // if we changed fullscreen state and we're in prefixed mode, trigger fullscreenchange
      // this is the only place where we trigger fullscreenchange events for older browsers
      // fullWindow mode is treated as a prefixed event and will get a fullscreenchange event as well
      // 如果我们更改了全屏状态，并且处于前缀模式，
      // 那么触发全屏更改这是我们为旧浏览器触发全屏更改事件的唯一地方fullWindow模式被视为一个前缀事件，并将获得一个全屏更改事件
      if (this.isFullscreen_ !== oldValue && this.fsApi_.prefixed) {
        /**
           * @event Player#fullscreenchange
           * @type {EventTarget~Event}
           */
        this.trigger('fullscreenchange');
      }

      this.toggleFullscreenClass_();
      return;
    }
    return this.isFullscreen_;
  }

  /**
   * Increase the size of the video to full screen
   *  将视频大小增大到全屏
   * In some browsers, full screen is not supported natively, so it enters
   * "full window mode", where the video fills the browser window.
   * 在某些浏览器中，本机不支持全屏显示，因此它进入“全窗口模式”，即视频填满浏览器窗口。
   * In browsers and devices that support native full screen, sometimes the
   * browser's default controls will be shown, and not the Video.js custom skin.
   * 在支持本机全屏显示的浏览器和设备中，有时会显示浏览器的默认控件，而不是video.js定制皮肤。
   * This includes most mobile devices (iOS, Android) and older versions of
   * Safari.
   *
   * @param  {Object} [fullscreenOptions]
   *         Override the player fullscreen options
   *@return {any} zzf add
   * @fires Player#fullscreenchange
   */
  requestFullscreen(fullscreenOptions) {
    const PromiseClass = this.options_.Promise || window.Promise;

    if (PromiseClass) {
      const self = this;

      return new PromiseClass((resolve, reject) => {
        function offHandler() {
          self.off('fullscreenerror', errorHandler);
          self.off('fullscreenchange', changeHandler);
        }
        function changeHandler() {
          offHandler();
          resolve();
        }
        function errorHandler(e, err) {
          offHandler();
          reject(err);
        }

        self.one('fullscreenchange', changeHandler);
        self.one('fullscreenerror', errorHandler);

        const promise = self.requestFullscreenHelper_(fullscreenOptions);

        if (promise) {
          promise.then(offHandler, offHandler);
          return promise;
        }
      });
    }

    return this.requestFullscreenHelper_();
  }

  requestFullscreenHelper_(fullscreenOptions) {
    let fsOptions;

    // Only pass fullscreen options to requestFullscreen in spec-compliant browsers.
    // 在符合规范的浏览器中，只向requestFullscreen传递全屏选项。
    // Use defaults or player configured option unless passed directly to this method.
    // 除非直接传递给此方法，否则使用默认值或播放器配置的选项。
    if (!this.fsApi_.prefixed) {
      fsOptions = this.options_.fullscreen && this.options_.fullscreen.options || {};
      if (fullscreenOptions !== undefined) {
        fsOptions = fullscreenOptions;
      }
    }

    // This method works as follows:
    // 该方法的工作原理如下：
    // 1. if a fullscreen api is available, use it
    //   1. call requestFullscreen with potential options
    //   2. if we got a promise from above, use it to update isFullscreen()
    // 2. otherwise, if the tech supports fullscreen, call `enterFullScreen` on it.
    //   This is particularly used for iPhone, older iPads, and non-safari browser on iOS.
    // 3. otherwise, use "fullWindow" mode
    if (this.fsApi_.requestFullscreen) {
      const promise = this.el_[this.fsApi_.requestFullscreen](fsOptions);

      if (promise) {
        promise.then(() => this.isFullscreen(true), () => this.isFullscreen(false));
      }

      return promise;
    } else if (this.tech_.supportsFullScreen()) {
      // we can't take the video.js controls fullscreen but we can go fullscreen
      // with native controls
      // 我们不能接受视频.js控件全屏显示，但我们可以使用本机控件全屏显示
      this.techCall_('enterFullScreen');
    } else {
      // fullscreen isn't supported so we'll just stretch the video element to
      // fill the viewport
      // 不支持全屏显示，所以我们只需拉伸视频元素来填充视窗
      this.enterFullWindow();
    }
  }

  /**
   * Return the video to its normal size after having been in full screen mode
   * 进入全屏模式后，将视频恢复到正常大小
   * @return {any} zzf add
   * @fires Player#fullscreenchange
   */
  exitFullscreen() {
    const PromiseClass = this.options_.Promise || window.Promise;

    if (PromiseClass) {
      const self = this;

      return new PromiseClass((resolve, reject) => {
        function offHandler() {
          self.off('fullscreenerror', errorHandler);
          self.off('fullscreenchange', changeHandler);
        }
        function changeHandler() {
          offHandler();
          resolve();
        }
        function errorHandler(e, err) {
          offHandler();
          reject(err);
        }

        self.one('fullscreenchange', changeHandler);
        self.one('fullscreenerror', errorHandler);

        const promise = self.exitFullscreenHelper_();

        if (promise) {
          promise.then(offHandler, offHandler);
          return promise;
        }
      });
    }

    return this.exitFullscreenHelper_();
  }

  exitFullscreenHelper_() {
    if (this.fsApi_.requestFullscreen) {
      const promise = document[this.fsApi_.exitFullscreen]();

      if (promise) {
        promise.then(() => this.isFullscreen(false));
      }

      return promise;
    } else if (this.tech_.supportsFullScreen()) {
      this.techCall_('exitFullScreen');
    } else {
      this.exitFullWindow();
    }
  }

  /**
   * When fullscreen isn't supported we can stretch the
   * video container to as wide as the browser will let us.
   * 当不支持全屏时，我们可以将视频容器扩展到浏览器允许的最大宽度。
   * @fires Player#enterFullWindow
   */
  enterFullWindow() {
    this.isFullscreen(true);
    this.isFullWindow = true;

    // Storing original doc overflow value to return to when fullscreen is off
    // 存储要在全屏关闭时返回的原始文档溢出值
    this.docOrigOverflow = document.documentElement.style.overflow;

    // Add listener for esc key to exit fullscreen
    // 添加esc键的侦听器以退出全屏
    Events.on(document, 'keydown', this.boundFullWindowOnEscKey_);

    // Hide any scroll bars
    // 隐藏任何滚动条
    document.documentElement.style.overflow = 'hidden';

    // Apply fullscreen styles
    // 应用全屏样式
    Dom.addClass(document.body, 'vjs-full-window');

    /**
     * @event Player#enterFullWindow
     * @type {EventTarget~Event}
     */
    this.trigger('enterFullWindow');
  }

  /**
   * Check for call to either exit full window or
   * full screen on ESC key
   * 检查是否调用ESC键退出全窗口或全屏
   * @param {string} event
   *        Event to check for key press
   */
  fullWindowOnEscKey(event) {
    if (keycode.isEventKey(event, 'Esc')) {
      if (this.isFullscreen() === true) {
        this.exitFullscreen();
      } else {
        this.exitFullWindow();
      }
    }
  }

  /**
   * Exit full window
   * 退出全窗口
   * @fires Player#exitFullWindow
   */
  exitFullWindow() {
    this.isFullscreen(false);
    this.isFullWindow = false;
    Events.off(document, 'keydown', this.boundFullWindowOnEscKey_);

    // Unhide scroll bars.
    // 取消隐藏滚动条。
    document.documentElement.style.overflow = this.docOrigOverflow;

    // Remove fullscreen styles
    // 移除全屏样式
    Dom.removeClass(document.body, 'vjs-full-window');

    // 将方框、控制器和海报调整为原始大小
    // this.positionAll();
    /**
     * @event Player#exitFullWindow
     * @type {EventTarget~Event}
     */
    this.trigger('exitFullWindow');
  }

  /**
   * Disable Picture-in-Picture mode.
   * 禁用画中画模式
   * @param {boolean} value
   *                  - true will disable Picture-in-Picture mode
   *                  - false will enable Picture-in-Picture mode
   * @return {any} zzf add
   */
  disablePictureInPicture(value) {
    if (value === undefined) {
      return this.techGet_('disablePictureInPicture');
    }
    this.techCall_('setDisablePictureInPicture', value);
    this.options_.disablePictureInPicture = value;
    this.trigger('disablepictureinpicturechanged');
  }

  /**
   * Check if the player is in Picture-in-Picture mode or tell the player that it
   * is or is not in Picture-in-Picture mode.
   * 检查player是否处于画中画模式，并告知player
   * @param  {boolean} [isPiP]
   *         Set the players current Picture-in-Picture state
   *
   * @return {boolean}
   *         - true if Picture-in-Picture is on and getting
   *         - false if Picture-in-Picture is off and getting
   */
  isInPictureInPicture(isPiP) {
    if (isPiP !== undefined) {
      this.isInPictureInPicture_ = !!isPiP;
      this.togglePictureInPictureClass_();
      return;
    }
    return !!this.isInPictureInPicture_;
  }

  /**
   * Create a floating video window always on top of other windows so that users may
   * continue consuming media while they interact with other content sites, or
   * applications on their device.
   * 在其他窗口上创建一个浮动的视频窗口，
   * 以便用户在与其他内容网站或设备上的应用程序交互时继续使用媒体。
   * @see [Spec]{@link https://wicg.github.io/picture-in-picture}
   *
   * @fires Player#enterpictureinpicture
   *
   * @return {Promise}
   *         A promise with a Picture-in-Picture window.
   */
  requestPictureInPicture() {
    if ('pictureInPictureEnabled' in document && this.disablePictureInPicture() === false) {
      /**
       * This event fires when the player enters picture in picture mode
       * 当player以图片模式进画中画模式时激发此事件
       * @event Player#enterpictureinpicture
       * @type {EventTarget~Event}
       */
      return this.techGet_('requestPictureInPicture');
    }
  }

  /**
   * Exit Picture-in-Picture mode.
   * 退出画中画模式
   * @see [Spec]{@link https://wicg.github.io/picture-in-picture}
   *
   * @fires Player#leavepictureinpicture
   *
   * @return {Promise}
   *         A promise.
   */
  exitPictureInPicture() {
    if ('pictureInPictureEnabled' in document) {
      /**
       * This event fires when the player leaves picture in picture mode
       *此事件在player退出画中画时激发
       * @event Player#leavepictureinpicture
       * @type {EventTarget~Event}
       */
      return document.exitPictureInPicture();
    }
  }

  /**
   * Called when this Player has focus and a key gets pressed down, or when
   * any Component of this player receives a key press that it doesn't handle.
   * 当此播放机具有焦点且某个键被按下时，或当该播放机的任何组件接收到它无法处理的按键时调用。
   * This allows player-wide hotkeys (either as defined below, or optionally
   * by an external function).
   * 这允许播放器范围内的热键（可以定义如下，也可以通过外部函数选择）
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {
    const {userActions} = this.options_;

    // Bail out if hotkeys are not configured.
    // 如果没有配置热键，则退出。
    if (!userActions || !userActions.hotkeys) {
      return;
    }

    // Function that determines whether or not to exclude an element from
    // hotkeys handling.
    // 确定是否从热键处理中排除元素的函数。
    const excludeElement = (el) => {
      const tagName = el.tagName.toLowerCase();

      // The first and easiest test is for `contenteditable` elements.
      // 第一个也是最简单的测试是针对“contenteditable”元素
      if (el.isContentEditable) {
        return true;
      }

      // Inputs matching these types will still trigger hotkey handling as
      // they are not text inputs.
      // 与这些类型匹配的输入仍将触发热键处理，因为它们不是文本输入。
      const allowedInputTypes = [
        'button',
        'checkbox',
        'hidden',
        'radio',
        'reset',
        'submit'
      ];

      if (tagName === 'input') {
        return allowedInputTypes.indexOf(el.type) === -1;
      }

      // The final test is by tag name. These tags will be excluded entirely.
      // 最后的测试是通过标记名。这些标签将被完全排除。
      const excludedTags = ['textarea'];

      return excludedTags.indexOf(tagName) !== -1;
    };

    // Bail out if the user is focused on an interactive form element.
    // 如果用户的注意力集中在交互式表单元素上，请退出
    if (excludeElement(this.el_.ownerDocument.activeElement)) {
      return;
    }

    if (typeof userActions.hotkeys === 'function') {
      userActions.hotkeys.call(this, event);
    } else {
      this.handleHotkeys(event);
    }
  }

  /**
   * Called when this Player receives a hotkey keydown event.
   * 当此播放机接收到热键按下事件时调用。
   * Supported player-wide hotkeys are:
   * 播放器支持的热键如下
   *   f          - toggle fullscreen
   *   m          - toggle mute
   *   k or Space - toggle play/pause
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   */
  handleHotkeys(event) {
    const hotkeys = this.options_.userActions ? this.options_.userActions.hotkeys : {};

    // set fullscreenKey, muteKey, playPauseKey from `hotkeys`, use defaults if not set
    // 从“hotkeys”设置fullscreenKey、muteKey、playPauseKey，如果未设置，则使用默认值
    const {
      fullscreenKey = keydownEvent => keycode.isEventKey(keydownEvent, 'f'),
      muteKey = keydownEvent => keycode.isEventKey(keydownEvent, 'm'),
      playPauseKey = keydownEvent => (keycode.isEventKey(keydownEvent, 'k') || keycode.isEventKey(keydownEvent, 'Space'))
    } = hotkeys;

    if (fullscreenKey.call(this, event)) {
      event.preventDefault();
      event.stopPropagation();

      const FSToggle = Component.getComponent('FullscreenToggle');

      if (document[this.fsApi_.fullscreenEnabled] !== false) {
        FSToggle.prototype.handleClick.call(this, event);
      }

    } else if (muteKey.call(this, event)) {
      event.preventDefault();
      event.stopPropagation();

      const MuteToggle = Component.getComponent('MuteToggle');

      MuteToggle.prototype.handleClick.call(this, event);

    } else if (playPauseKey.call(this, event)) {
      event.preventDefault();
      event.stopPropagation();

      const PlayToggle = Component.getComponent('PlayToggle');

      PlayToggle.prototype.handleClick.call(this, event);
    }
  }

  /**
   * Check whether the player can play a given mimetype
   * 检查player是否可以播放给定的mimetype
   * @see https://www.w3.org/TR/2011/WD-html5-20110113/video.html#dom-navigator-canplaytype
   *
   * @param {string} type
   *        The mimetype to check
   *
   * @return {string}
   *         'probably', 'maybe', or '' (empty string)
   */
  canPlayType(type) {
    let can;

    // Loop through each playback technology in the options order
    // 按选项顺序循环播放每个播放技术
    for (let i = 0, j = this.options_.techOrder; i < j.length; i++) {
      const techName = j[i];
      let tech = Tech.getTech(techName);

      // Support old behavior of techs being registered as components.
      // 支持技术注册为组件的旧行为。
      // Remove once that deprecated behavior is removed.
      // 一旦不推荐的行为被删除，就删除。
      if (!tech) {
        tech = Component.getComponent(techName);
      }

      // Check if the current tech is defined before continuing
      // 继续之前，检查当前技术是否已定义
      if (!tech) {
        log.error(`The "${techName}" tech is undefined. Skipped browser support check for that tech.`);
        continue;
      }

      // Check if the browser supports this technology
      // 检查浏览器是否支持此技术
      if (tech.isSupported()) {
        can = tech.canPlayType(type);

        if (can) {
          return can;
        }
      }
    }

    return '';
  }

  /**
   * Select source based on tech-order or source-order
   * Uses source-order selection if `options.sourceOrder` is truthy. Otherwise,
   * defaults to tech-order selection
   * 根据技术顺序或来源顺序选择来源。如果`选项.sourceOrder`是真的。否则，默认为tech-order选择
   * @param {Array} sources
   *        The sources for a media asset
   *
   * @return {Object|boolean}
   *         Object of source and tech order or false
   */
  selectSource(sources) {
    // Get only the techs specified in `techOrder` that exist and are supported by the
    // current platform
    // 仅获取“techOrder”中指定的存在且受当前平台支持的技术
    const techs =
      this.options_.techOrder
        .map((techName) => {
          return [techName, Tech.getTech(techName)];
        })
        .filter(([techName, tech]) => {
          // 继续之前，检查当前技术是否已定义
          if (tech) {
            // Check if the browser supports this technology
            // 检查浏览器是否支持此技术
            return tech.isSupported();
          }

          log.error(`The "${techName}" tech is undefined. Skipped browser support check for that tech.`);
          return false;
        });

    // Iterate over each `innerArray` element once per `outerArray` element and execute
    // `tester` with both. If `tester` returns a non-falsy value, exit early and return
    // that value.
    // 对每个“outerArray”元素迭代每个“innerArray”元素一次，
    // 并使用这两个元素执行“tester”。如果“tester”返回非错误值，请尽早退出并返回该值。
    const findFirstPassingTechSourcePair = function(outerArray, innerArray, tester) {
      let found;

      outerArray.some((outerChoice) => {
        return innerArray.some((innerChoice) => {
          found = tester(outerChoice, innerChoice);

          if (found) {
            return true;
          }
        });
      });

      return found;
    };

    let foundSourceAndTech;
    const flip = (fn) => (a, b) => fn(b, a);
    const finder = ([techName, tech], source) => {
      if (tech.canPlaySource(source, this.options_[techName.toLowerCase()])) {
        return {source, tech: techName};
      }
    };


    if (this.options_.sourceOrder) {
      // Source-first ordering
      // 源代码优先排序
      foundSourceAndTech = findFirstPassingTechSourcePair(sources, techs, flip(finder));
    } else {
      // Tech-first ordering
      // tech优先度排序
      foundSourceAndTech = findFirstPassingTechSourcePair(techs, sources, finder);
    }

    return foundSourceAndTech || false;
  }

  /**
   * Get or set the video source.
   * 获取或设置媒体资源
   * @param {Tech~SourceObject|Tech~SourceObject[]|string} [source]
   *        A SourceObject, an array of SourceObjects, or a string referencing
   *        a URL to a media source. It is _highly recommended_ that an object
   *        or array of objects is used here, so that source selection
   *        algorithms can take the `type` into account.
   *
   *        If not provided, this method acts as a getter.
   *
   * @return {string|undefined}
   *         If the `source` argument is missing, returns the current source
   *         URL. Otherwise, returns nothing/undefined.
   */
  src(source) {
    // getter usage
    // 获取
    if (typeof source === 'undefined') {
      return this.cache_.src || '';
    }
    // filter out invalid sources and turn our source into
    // an array of source objects
    // 过滤掉无效的源代码并将源代码转换为源对象数组
    const sources = filterSource(source);

    // if a source was passed in then it is invalid because
    // it was filtered to a zero length Array. So we have to
    // show an error
    // 如果传入了一个源，则它是无效的，因为它被筛选为长度为零的数组。所以我们必须显示一个错误
    if (!sources.length) {
      this.setTimeout(function() {
        this.error({ code: 4, message: this.localize(this.options_.notSupportedMessage) });
      }, 0);
      return;
    }

    // initial sources
    // 初始化资源
    this.changingSrc_ = true;

    this.cache_.sources = sources;
    this.updateSourceCaches_(sources[0]);

    // middlewareSource是中间件更改后的源
    middleware.setSource(this, sources[0], (middlewareSource, mws) => {
      this.middleware_ = mws;

      // 因为sourceSet是异步的，所以在选择源之后，我们必须再次更新缓存，
      // 因为所选的源可能会在这个回调上面的缓存更新中出现顺序错误。
      this.cache_.sources = sources;
      this.updateSourceCaches_(middlewareSource);

      const err = this.src_(middlewareSource);

      if (err) {
        if (sources.length > 1) {
          return this.src(sources.slice(1));
        }

        this.changingSrc_ = false;

        // We need to wrap this in a timeout to give folks a chance to add error event handlers
        // 我们需要在一个超时中包装它，以便让人们有机会添加错误事件处理程序
        this.setTimeout(function() {
          this.error({ code: 4, message: this.localize(this.options_.notSupportedMessage) });
        }, 0);

        // we could not find an appropriate tech, but let's still notify the delegate that this is it
        // this needs a better comment about why this is needed
        // 我们找不到合适的技术，但我们还是要通知学员，就是这样，需要更好地说明为什么需要这样做
        this.triggerReady();

        return;
      }

      middleware.setTech(mws, this.tech_);
    });
  }

  /**
   * Set the source object on the tech, returns a boolean that indicates whether
   * there is a tech that can play the source or not
   * 在tech上设置source对象，返回一个boolean值，指示是否有一个tech可以播放该源
   * @param {Tech~SourceObject} source
   *        The source object to set on the Tech
   *
   * @return {boolean}
   *         - True if there is no Tech to playback this source
   *         - False otherwise
   *
   * @private
   */
  src_(source) {
    const sourceTech = this.selectSource([source]);

    if (!sourceTech) {
      return true;
    }

    if (!titleCaseEquals(sourceTech.tech, this.techName_)) {
      this.changingSrc_ = true;
      // load this technology with the chosen source
      // 使用所选源加载此技术
      this.loadTech_(sourceTech.tech, sourceTech.source);
      this.tech_.ready(() => {
        this.changingSrc_ = false;
      });
      return false;
    }

    // wait until the tech is ready to set the source
    // and set it synchronously if possible (#2326)
    // 等到技术人员准备好设置资源，如果可能的话，同步设置
    this.ready(function() {

      // The setSource tech method was added with source handlers
      // so older techs won't support it
      // setSource tech方法是与源处理程序一起添加的，因此旧的tech将不支持它
      // We need to check the direct prototype for the case where subclasses
      // of the tech do not support source handlers
      // 如果技术的子类不支持源处理程序，我们需要检查直接原型
      if (this.tech_.constructor.prototype.hasOwnProperty('setSource')) {
        this.techCall_('setSource', source);
      } else {
        this.techCall_('src', source.src);
      }

      this.changingSrc_ = false;
    }, true);

    return false;
  }

  /**
   * 开始加载src数据。
   */
  load() {
    this.techCall_('load');
  }

  /**
   * Reset the player. Loads the first tech in the techOrder,
   * removes all the text tracks in the existing `tech`,
   * and calls `reset` on the `tech`.
   * 重置播放器。加载techOrder中的第一个tech，删除现有“tech”中的所有文本轨迹，并在“tech”上调用“reset”
   */
  reset() {
    const PromiseClass = this.options_.Promise || window.Promise;

    if (this.paused() || !PromiseClass) {
      this.doReset_();
    } else {
      const playPromise = this.play();

      silencePromise(playPromise.then(() => this.doReset_()));
    }
  }

  doReset_() {
    if (this.tech_) {
      this.tech_.clearTracks('text');
    }
    this.resetCache_();
    this.poster('');
    this.loadTech_(this.options_.techOrder[0], null);
    this.techCall_('reset');
    this.resetControlBarUI_();
    if (isEvented(this)) {
      this.trigger('playerreset');
    }
  }

  /**
   * Reset Control Bar's UI by calling sub-methods that reset
   * all of Control Bar's components
   * 通过调用重置控件栏所有组件的子方法重置控件栏的UI
   */
  resetControlBarUI_() {
    this.resetProgressBar_();
    this.resetPlaybackRate_();
    this.resetVolumeBar_();
  }

  /**
   * Reset tech's progress so progress bar is reset in the UI
   * 重置技术进度，以便在UI中重置进度条
   */
  resetProgressBar_() {
    this.currentTime(0);

    const { durationDisplay, remainingTimeDisplay } = this.controlBar;

    if (durationDisplay) {
      durationDisplay.updateContent();
    }

    if (remainingTimeDisplay) {
      remainingTimeDisplay.updateContent();
    }
  }

  /**
   * Reset Playback ratio
   * 重置播放比率
   */
  resetPlaybackRate_() {
    this.playbackRate(this.defaultPlaybackRate());
    this.handleTechRateChange_();
  }

  /**
   * 重置音量选项
   */
  resetVolumeBar_() {
    this.volume(1.0);
    this.trigger('volumechange');
  }

  /**
   * Returns all of the current source objects.
   * 返回所有当前源对象。
   * @return {Tech~SourceObject[]}
   *         The current source objects
   */
  currentSources() {
    const source = this.currentSource();
    const sources = [];

    // assume `{}` or `{ src }`
    if (Object.keys(source).length !== 0) {
      sources.push(source);
    }

    return this.cache_.sources || sources;
  }

  /**
   * Returns the current source object.
   * 返回当前源对象。
   * @return {Tech~SourceObject}
   *         The current source object
   */
  currentSource() {
    return this.cache_.source || {};
  }

  /**
   * Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4
   * Can be used in conjunction with `currentType` to assist in rebuilding the current source object.
   * 返回当前资源的URL
   * @return {string}
   *         The current source
   */
  currentSrc() {
    return this.currentSource() && this.currentSource().src || '';
  }

  /**
   * Get the current source type e.g. video/mp4
   * 获取当前的资源格式
   * This can allow you rebuild the current source object so that you could load the same
   * source and tech later
   * 这可以使您重新构建当前源对象，以便以后可以加载相同的源和技术
   * @return {string}
   *         The source MIME type
   */
  currentType() {
    return this.currentSource() && this.currentSource().type || '';
  }

  /**
   * Get or set the preload attribute
   * 获取或设置preload属性
   * @param {boolean} [value]
   *        - true means that we should preload
   *        - false means that we should not preload
   *
   * @return {string}
   *         The preload attribute value when getting
   */
  preload(value) {
    if (value !== undefined) {
      this.techCall_('setPreload', value);
      this.options_.preload = value;
      return;
    }
    return this.techGet_('preload');
  }

  /**
   * Get or set the autoplay option. When this is a boolean it will
   * modify the attribute on the tech. When this is a string the attribute on
   * the tech will be removed and `Player` will handle autoplay on loadstarts.
   * 获取或设置自动播放选项。当这是一个布尔值时，它将修改技术上的属性。当这是一个字符串时，
   * 技术上的属性将被删除，并且“Player”将处理加载启动时的自动播放。
   * @param {boolean|string} [value]
   *        - true: autoplay using the browser behavior
   *        - false: do not autoplay
   *        - 'play': call play() on every loadstart
   *        - 'muted': call muted() then play() on every loadstart
   *        - 'any': call play() on every loadstart. if that fails call muted() then play().
   *        - *: values other than those listed here will be set `autoplay` to true
   *
   * @return {boolean|string}
   *         The current value of autoplay when getting
   */
  autoplay(value) {
    // 作为getter使用
    if (value === undefined) {
      return this.options_.autoplay || false;
    }

    let techAutoplay;

    // if the value is a valid string set it to that
    // 如果值是有效字符串，则将其设置
    if (typeof value === 'string' && (/(any|play|muted)/).test(value)) {
      this.options_.autoplay = value;
      this.manualAutoplay_(value);
      techAutoplay = false;

    // any falsy value sets autoplay to false in the browser,
    // lets do the same
    // 任何错误的值都会在浏览器中将autoplay设置为false，也可以这样做
    } else if (!value) {
      this.options_.autoplay = false;

    // any other value (ie truthy) sets autoplay to true
    // 任何其他值（即truthy）都会将autoplay设置为true
    } else {
      this.options_.autoplay = true;
    }

    techAutoplay = typeof techAutoplay === 'undefined' ? this.options_.autoplay : techAutoplay;


    if (this.tech_) {
      this.techCall_('setAutoplay', techAutoplay);
    }
  }

  /**
   * Set or unset the playsinline attribute.
   * 设置或取消设置playsinline属性。
   * Playsinline tells the browser that non-fullscreen playback is preferred.
   * Playsinline告诉浏览器首选非全屏播放。
   * @param {boolean} [value]
   *        - true means that we should try to play inline by default
   *        - false means that we should use the browser's default playback mode,
   *          which in most cases is inline. iOS Safari is a notable exception
   *          and plays fullscreen by default.
   *
   * @return {string|Player}
   *         - the current value of playsinline
   *         - the player when setting
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
   */
  playsinline(value) {
    if (value !== undefined) {
      this.techCall_('setPlaysinline', value);
      this.options_.playsinline = value;
      return this;
    }
    return this.techGet_('playsinline');
  }

  /**
   * Get or set the loop attribute on the video element.
   * 获取或设置视频元素的循环属性。
   * @param {boolean} [value]
   *        - true means that we should loop the video
   *        - false means that we should not loop the video
   *
   * @return {boolean}
   *         The current value of loop when getting
   */
  loop(value) {
    if (value !== undefined) {
      this.techCall_('setLoop', value);
      this.options_.loop = value;
      return;
    }
    return this.techGet_('loop');
  }

  /**
   * Get or set the poster image source url
   * 获取或设置海报图像源url
   * @fires Player#posterchange
   *
   * @param {string} [src]
   *        Poster image source URL
   *
   * @return {string}
   *         The current value of poster when getting
   */
  poster(src) {
    if (src === undefined) {
      return this.poster_;
    }

    // The correct way to remove a poster is to set as an empty string
    // other falsey values will throw errors
    // 删除海报的正确方法是将其他错误值设置为空字符串
    if (!src) {
      src = '';
    }

    if (src === this.poster_) {
      return;
    }

    // update the internal poster variable
    // 更新内部海报变量
    this.poster_ = src;

    // 更新tech的海报
    this.techCall_('setPoster', src);

    this.isPosterFromTech_ = false;

    // alert components that the poster has been set
    // 提醒组件海报已设置
    /**
     * This event fires when the poster image is changed on the player.
     * 此事件在播放机上的海报图像更改时激发。
     * @event Player#posterchange
     * @type {EventTarget~Event}
     */
    this.trigger('posterchange');
  }

  /**
   * Some techs (e.g. YouTube) can provide a poster source in an
   * asynchronous way. We want the poster component to use this
   * poster source so that it covers up the tech's controls.
   * (YouTube's play button). However we only want to use this
   * source if the player user hasn't set a poster through
   * the normal APIs.
   *
   * @fires Player#posterchange
   * @listens Tech#posterchange
   * @private
   */
  handleTechPosterChange_() {
    if ((!this.poster_ || this.options_.techCanOverridePoster) && this.tech_ && this.tech_.poster) {
      const newPoster = this.tech_.poster() || '';

      if (newPoster !== this.poster_) {
        this.poster_ = newPoster;
        this.isPosterFromTech_ = true;

        // Let components know the poster has changed
        // 通知部件海报已更改
        this.trigger('posterchange');
      }
    }
  }

  /**
   * Get or set whether or not the controls are showing.
   * 获取或设置控件是否显示。
   * @fires Player#controlsenabled
   *
   * @param {boolean} [bool]
   *        - true to turn controls on
   *        - false to turn controls off
   *
   * @return {boolean}
   *         The current value of controls when getting
   */
  controls(bool) {
    if (bool === undefined) {
      return !!this.controls_;
    }

    bool = !!bool;

    // Don't trigger a change event unless it actually changed
    // 除非实际更改，否则不要触发更改事件
    if (this.controls_ === bool) {
      return;
    }

    this.controls_ = bool;

    if (this.usingNativeControls()) {
      this.techCall_('setControls', bool);
    }

    if (this.controls_) {
      this.removeClass('vjs-controls-disabled');
      this.addClass('vjs-controls-enabled');
      /**
       * @event Player#controlsenabled
       * @type {EventTarget~Event}
       */
      this.trigger('controlsenabled');
      if (!this.usingNativeControls()) {
        this.addTechControlsListeners_();
      }
    } else {
      this.removeClass('vjs-controls-enabled');
      this.addClass('vjs-controls-disabled');
      /**
       * @event Player#controlsdisabled
       * @type {EventTarget~Event}
       */
      this.trigger('controlsdisabled');
      if (!this.usingNativeControls()) {
        this.removeTechControlsListeners_();
      }
    }
  }

  /**
   * Toggle native controls on/off. Native controls are the controls built into
   * devices (e.g. default iPhone controls), Flash, or other techs
   * 打开/关闭本机控件。本机控件是内置于设备（例如默认iPhone控件）、Flash或其他技术的控件
   * (e.g. Vimeo Controls)
   * **This should only be set by the current tech, because only the tech knows
   * if it can support native controls**
   *
   * @fires Player#usingnativecontrols
   * @fires Player#usingcustomcontrols
   *
   * @param {boolean} [bool]
   *        - true to turn native controls on
   *        - false to turn native controls off
   *
   * @return {boolean}
   *         The current value of native controls when getting
   */
  usingNativeControls(bool) {
    if (bool === undefined) {
      return !!this.usingNativeControls_;
    }

    bool = !!bool;

    // Don't trigger a change event unless it actually changed
    // 除非实际更改，否则不要触发更改事件
    if (this.usingNativeControls_ === bool) {
      return;
    }

    this.usingNativeControls_ = bool;

    if (this.usingNativeControls_) {
      this.addClass('vjs-using-native-controls');

      /**
       * player is using the native device controls
       * 播放机正在使用本机设备控件
       * @event Player#usingnativecontrols
       * @type {EventTarget~Event}
       */
      this.trigger('usingnativecontrols');
    } else {
      this.removeClass('vjs-using-native-controls');

      /**
       * player is using the custom HTML controls
       * 播放机正在使用自定义HTML控件
       * @event Player#usingcustomcontrols
       * @type {EventTarget~Event}
       */
      this.trigger('usingcustomcontrols');
    }
  }

  /**
   * Set or get the current MediaError
   * 设置或获取当前媒体错误
   * @fires Player#error
   *
   * @param  {MediaError|string|number} [err]
   *         A MediaError or a string/number to be turned
   *         into a MediaError
   *
   * @return {MediaError|null}
   *         The current MediaError when getting (or null)
   */
  error(err) {
    if (err === undefined) {
      return this.error_ || null;
    }

    // 在用户交互之前，禁止显示没有兼容源的第一条错误消息
    if (this.options_.suppressNotSupportedError &&
        err && err.code === 4
    ) {
      const triggerSuppressedError = function() {
        this.error(err);
      };

      this.options_.suppressNotSupportedError = false;
      this.any(['click', 'touchstart'], triggerSuppressedError);
      this.one('loadstart', function() {
        this.off(['click', 'touchstart'], triggerSuppressedError);
      });
      return;
    }

    // restoring to default
    // 恢复到默认值
    if (err === null) {
      this.error_ = err;
      this.removeClass('vjs-error');
      if (this.errorDisplay) {
        this.errorDisplay.close();
      }
      return;
    }

    this.error_ = new MediaError(err);

    // add the vjs-error classname to the player
    // 将vjs-error类名添加到播放器
    this.addClass('vjs-error');

    // log the name of the error type and any message
    // 记录错误类型的名称和任何消息
    // IE11 logs "[object object]" and required you to expand message to see error object
    log.error(`(CODE:${this.error_.code} ${MediaError.errorTypes[this.error_.code]})`, this.error_.message, this.error_);

    /**
     * @event Player#error
     * @type {EventTarget~Event}
     */
    this.trigger('error');

    return;
  }

  /**
   * Report user activity
   * 报告用户动作
   * @param {Object} event
   *        Event object
   */
  reportUserActivity(event) {
    this.userActivity_ = true;
  }

  /**
   * Get/set if user is active
   * 如果用户处于活动状态，则获取/设置
   * @fires Player#useractive
   * @fires Player#userinactive
   *
   * @param {boolean} [bool]
   *        - true if the user is active
   *        - false if the user is inactive
   *
   * @return {boolean}
   *         The current value of userActive when getting
   */
  userActive(bool) {
    if (bool === undefined) {
      return this.userActive_;
    }

    bool = !!bool;

    if (bool === this.userActive_) {
      return;
    }

    this.userActive_ = bool;

    if (this.userActive_) {
      this.userActivity_ = true;
      this.removeClass('vjs-user-inactive');
      this.addClass('vjs-user-active');
      /**
       * @event Player#useractive
       * @type {EventTarget~Event}
       */
      this.trigger('useractive');
      return;
    }


    if (this.tech_) {
      this.tech_.one('mousemove', function(e) {
        e.stopPropagation();
        e.preventDefault();
      });
    }

    this.userActivity_ = false;
    this.removeClass('vjs-user-active');
    this.addClass('vjs-user-inactive');
    /**
     * @event Player#userinactive
     * @type {EventTarget~Event}
     */
    this.trigger('userinactive');
  }

  /**
   * Listen for user activity based on timeout value
   * 根据超时值侦听用户活动
   * @private
   */
  listenForUserActivity_() {
    let mouseInProgress;
    let lastMoveX;
    let lastMoveY;
    const handleActivity = Fn.bind(this, this.reportUserActivity);

    const handleMouseMove = function(e) {
      // #1068 - Prevent mousemove spamming
      // Chrome Bug: https://code.google.com/p/chromium/issues/detail?id=366970
      if (e.screenX !== lastMoveX || e.screenY !== lastMoveY) {
        lastMoveX = e.screenX;
        lastMoveY = e.screenY;
        handleActivity();
      }
    };

    const handleMouseDown = function() {
      handleActivity();
      // For as long as the they are touching the device or have their mouse down,
      // we consider them active even if they're not moving their finger or mouse.
      // So we want to continue to update that they are active
      // 只要他们在触摸设备或按下鼠标，即使他们没有移动手指或鼠标，
      // 我们也认为他们是活跃的。所以我们想继续更新他们是活跃的
      this.clearInterval(mouseInProgress);
      // Setting userActivity=true now and setting the interval to the same time
      // as the activityCheck interval (250) should ensure we never miss the
      // next activityCheck
      // 现在设置userActivity=true并将间隔设置为与activityCheck间隔（250）相同的时间，
      // 可以确保我们永远不会错过下一个activityCheck
      mouseInProgress = this.setInterval(handleActivity, 250);
    };

    const handleMouseUpAndMouseLeave = function(event) {
      handleActivity();
      // 如果鼠标/触控按下，停止保持活动的间隔
      this.clearInterval(mouseInProgress);
    };

    // Any mouse movement will be considered user activity
    // 任何鼠标移动都将被视为用户活动
    this.on('mousedown', handleMouseDown);
    this.on('mousemove', handleMouseMove);
    this.on('mouseup', handleMouseUpAndMouseLeave);
    this.on('mouseleave', handleMouseUpAndMouseLeave);

    const controlBar = this.getChild('controlBar');

    // Fixes bug on Android & iOS where when tapping progressBar (when control bar is displayed)
    // controlBar would no longer be hidden by default timeout.
    // 修正了Android&iOS上的错误，当点击progressBar（当显示控制栏时）controlBar在默认超时下不再隐藏。
    if (controlBar && !browser.IS_IOS && !browser.IS_ANDROID) {

      controlBar.on('mouseenter', function(event) {
        this.player().cache_.inactivityTimeout = this.player().options_.inactivityTimeout;
        this.player().options_.inactivityTimeout = 0;
      });

      controlBar.on('mouseleave', function(event) {
        this.player().options_.inactivityTimeout = this.player().cache_.inactivityTimeout;
      });

    }

    // Listen for keyboard navigation
    // Shouldn't need to use inProgress interval because of key repeat
    // 监听键盘动作，不需要使用进程间隔，因为按键重复
    this.on('keydown', handleActivity);
    this.on('keyup', handleActivity);


    let inactivityTimeout;

    this.setInterval(function() {
      // Check to see if mouse/touch activity has happened
      // 检查鼠标/触摸活动是否发生
      if (!this.userActivity_) {
        return;
      }

      // Reset the activity tracker
      // 重置活动跟踪器
      this.userActivity_ = false;

      // 如果用户状态为“不活动”，将状态设置为“活动”
      this.userActive(true);

      // 清除任何现有的非活动超时以重新启动计时器
      this.clearTimeout(inactivityTimeout);

      const timeout = this.options_.inactivityTimeout;

      if (timeout <= 0) {
        return;
      }

      // 在<timeout>毫秒内，如果没有更多活动发生，则用户将被视为不活动
      inactivityTimeout = this.setTimeout(function() {
        // Protect against the case where the inactivityTimeout can trigger just
        // before the next user activity is picked up by the activity check loop
        // causing a flicker
        // 防止不活动超时可能在活动检查循环拾取下一个用户活动之前触发，从而导致闪烁
        if (!this.userActivity_) {
          this.userActive(false);
        }
      }, timeout);

    }, 250);
  }

  /**
   * Gets or sets the current playback rate. A playback rate of
   * 1.0 represents normal speed and 0.5 would indicate half-speed
   * playback, for instance.
   * 获取或设置当前播放速率。例如，播放速率为1.0表示正常速度，0.5表示半速播放。
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-playbackrate
   *
   * @param {number} [rate]
   *       New playback rate to set.
   *
   * @return {number}
   *         The current playback rate when getting or 1.0
   */
  playbackRate(rate) {
    if (rate !== undefined) {
      // NOTE: this.cache_.lastPlaybackRate is set from the tech handler
      // that is registered above
      this.techCall_('setPlaybackRate', rate);
      // this.selectSource(1);
      return;
    }

    if (this.tech_ && this.tech_.featuresPlaybackRate) {
      return this.cache_.lastPlaybackRate || this.techGet_('playbackRate');
    }
    return 1.0;
  }

  /**
   * Gets or sets the current default playback rate. A default playback rate of
   * 1.0 represents normal speed and 0.5 would indicate half-speed playback, for instance.
   * defaultPlaybackRate will only represent what the initial playbackRate of a video was, not
   * not the current playbackRate.
   * 获取或设置当前默认播放速率。例如，默认播放速率1.0表示正常速度，0.5表示半速播放。defaultPlaybackRate只代表视频的初始播放速率，而不是当前的播放速率。
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-defaultplaybackrate
   *
   * @param {number} [rate]
   *       New default playback rate to set.
   *
   * @return {number|Player}
   *         - The default playback rate when getting or 1.0
   *         - the player when setting
   */
  defaultPlaybackRate(rate) {
    if (rate !== undefined) {
      return this.techCall_('setDefaultPlaybackRate', rate);
    }

    if (this.tech_ && this.tech_.featuresPlaybackRate) {
      return this.techGet_('defaultPlaybackRate');
    }
    return 1.0;
  }

  /**
   * Gets or sets the audio flag
   * 获取或设置audio flag
   * @param {boolean} bool
   *        - true signals that this is an audio player
   *        - false signals that this is not an audio player
   *
   * @return {boolean}
   *         The current value of isAudio when getting
   */
  isAudio(bool) {
    if (bool !== undefined) {
      this.isAudio_ = !!bool;
      return;
    }

    return !!this.isAudio_;
  }

  /**
   * A helper method for adding a {@link TextTrack} to our
   * {@link TextTrackList}.
   * 一个帮助器方法，用于将{@linktexttrack}添加到我们的{@linktexttracklist}。
   * In addition to the W3C settings we allow adding additional info through options.
   * 除了W3C设置，我们还允许通过选项添加附加信息。
   * @see http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
   *
   * @param {string} [kind]
   *        the kind of TextTrack you are adding
   *
   * @param {string} [label]
   *        the label to give the TextTrack label
   *
   * @param {string} [language]
   *        the language to set on the TextTrack
   *
   * @return {TextTrack|undefined}
   *         the TextTrack that was added or undefined
   *         if there is no tech
   */
  addTextTrack(kind, label, language) {
    if (this.tech_) {
      return this.tech_.addTextTrack(kind, label, language);
    }
  }

  /**
   * Create a remote {@link TextTrack} and an {@link HTMLTrackElement}.
   * When manualCleanup is set to false, the track will be automatically removed
   * on source changes.
   * 创建远程{@linktexttrack}和{@linkhtmltrackelement}。当manualCleanup设置为false时，轨迹将在源代码更改时自动删除。
   * @param {Object} options
   *        Options to pass to {@link HTMLTrackElement} during creation. See
   *        {@link HTMLTrackElement} for object properties that you should use.
   *
   * @param {boolean} [manualCleanup=true] if set to false, the TextTrack will be
   *                                       removed on a source change
   *
   * @return {HtmlTrackElement}
   *         the HTMLTrackElement that was created and added
   *         to the HtmlTrackElementList and the remote
   *         TextTrackList
   *
   * @deprecated The default value of the "manualCleanup" parameter will default
   *             to "false" in upcoming versions of Video.js
   */
  addRemoteTextTrack(options, manualCleanup) {
    if (this.tech_) {
      return this.tech_.addRemoteTextTrack(options, manualCleanup);
    }
  }

  /**
   * Remove a remote {@link TextTrack} from the respective
   * {@link TextTrackList} and {@link HtmlTrackElementList}.
   * 从相应的{@link textracklist}和{@link HtmlTrackElementList}中删除远程{@link TextTrack}。
   * @param {Object} obj
   *        Remote {@link TextTrack} to remove
   *
   * @return {undefined}
   *         does not return anything
   */
  removeRemoteTextTrack(obj = {}) {
    let {track} = obj;

    if (!track) {
      track = obj;
    }

    // destructure the input into an object with a track argument, defaulting to arguments[0]
    // default the whole argument to an empty object if nothing was passed in
    // 用track参数将输入解构成一个对象，默认为参数[0]如果没有传入任何内容，则将整个参数默认为空对象
    if (this.tech_) {
      return this.tech_.removeRemoteTextTrack(track);
    }
  }

  /**
   * Gets available media playback quality metrics as specified by the W3C's Media
   * Playback Quality API.
   * 获取W3C的媒体播放质量API指定的可用媒体播放质量度量。
   * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
   *
   * @return {Object|undefined}
   *         An object with supported media playback quality metrics or undefined if there
   *         is no tech or the tech does not support it.
   */
  getVideoPlaybackQuality() {
    return this.techGet_('getVideoPlaybackQuality');
  }

  /**
   * Get video width
   * 获取视频宽度
   * @return {number}
   *         current video width
   */
  videoWidth() {
    return this.tech_ && this.tech_.videoWidth && this.tech_.videoWidth() || 0;
  }

  /**
   * Get video height
   * 获取视频高度
   * @return {number}
   *         current video height
   */
  videoHeight() {
    return this.tech_ && this.tech_.videoHeight && this.tech_.videoHeight() || 0;
  }

  /**
   * The player's language code.
   * player语言编码
   * Changing the langauge will trigger
   * [languagechange]{@link Player#event:languagechange}
   * which Components can use to update control text.
   * ClickableComponent will update its control text by default on
   * [languagechange]{@link Player#event:languagechange}.
   *
   * @fires Player#languagechange
   *
   * @param {string} [code]
   *        the language code to set the player to
   *
   * @return {string}
   *         The current language code when getting
   */
  language(code) {
    if (code === undefined) {
      return this.language_;
    }

    if (this.language_ !== String(code).toLowerCase()) {
      this.language_ = String(code).toLowerCase();

      // during first init, it's possible some things won't be evented
      // 在第一次初始化期间，有些事情可能不会被事件化
      if (isEvented(this)) {
        /**
        * fires when the player language change
        *
        * @event Player#languagechange
        * @type {EventTarget~Event}
        */
        this.trigger('languagechange');
      }
    }
  }

  /**
   * Get the player's language dictionary
   * Merge every time, because a newly added plugin might call videojs.addLanguage() at any time
   * Languages specified directly in the player options have precedence
   * 每次都要合并播放器的语言词典，因为新添加的插件可能会调用videojs.addLanguage（）在任何时候，直接在播放器选项中指定的语言都具有优先权
   * @return {Array}
   *         An array of of supported languages
   */
  languages() {
    return mergeOptions(Player.prototype.options_.languages, this.languages_);
  }

  /**
   * returns a JavaScript object reperesenting the current track
   * information. **DOES not return it as JSON**
   * 返回重新显示当前轨迹的JavaScript对象信息。
   * @return {Object}
   *         Object representing the current of track info
   */
  toJSON() {
    const options = mergeOptions(this.options_);
    const tracks = options.tracks;

    options.tracks = [];

    for (let i = 0; i < tracks.length; i++) {
      let track = tracks[i];

      // deep merge tracks and null out player so no circular references
      // 深度合并曲目和空出播放器，因此没有循环引用
      track = mergeOptions(track);
      track.player = undefined;
      options.tracks[i] = track;
    }

    return options;
  }

  /**
   * Creates a simple modal dialog (an instance of the {@link ModalDialog}
   * component) that immediately overlays the player with arbitrary
   * content and removes itself when closed.
   * 创建一个简单的模式对话框（一个{@linkmodaldialog}组件的实例），它立即用任意内容覆盖播放器，并在关闭时自动删除。
   * @param {string|Function|Element|Array|null} content
   *        Same as {@link ModalDialog#content}'s param of the same name.
   *        The most straight-forward usage is to provide a string or DOM
   *        element.
   *
   * @param {Object} [options]
   *        Extra options which will be passed on to the {@link ModalDialog}.
   *
   * @return {ModalDialog}
   *         the {@link ModalDialog} that was created
   */
  createModal(content, options) {
    options = options || {};
    options.content = content || '';

    const modal = new ModalDialog(this, options);

    this.addChild(modal);
    modal.on('dispose', () => {
      this.removeChild(modal);
    });

    modal.open();
    return modal;
  }

  /**
   * Change breakpoint classes when the player resizes.
   * 当播放器调整大小时更改断点类。
   * @private
   */
  updateCurrentBreakpoint_() {
    if (!this.responsive()) {
      return;
    }

    const currentBreakpoint = this.currentBreakpoint();
    const currentWidth = this.currentWidth();

    for (let i = 0; i < BREAKPOINT_ORDER.length; i++) {
      const candidateBreakpoint = BREAKPOINT_ORDER[i];
      const maxWidth = this.breakpoints_[candidateBreakpoint];

      if (currentWidth <= maxWidth) {

        // The current breakpoint did not change, nothing to do.
        // 当前断点未更改，无需执行任何操作。
        if (currentBreakpoint === candidateBreakpoint) {
          return;
        }

        // Only remove a class if there is a current breakpoint.
        // 只有在存在当前断点时才删除类。
        if (currentBreakpoint) {
          this.removeClass(BREAKPOINT_CLASSES[currentBreakpoint]);
        }

        this.addClass(BREAKPOINT_CLASSES[candidateBreakpoint]);
        this.breakpoint_ = candidateBreakpoint;
        break;
      }
    }
  }

  /**
   * Removes the current breakpoint.
   * 删除当前断点。
   * @private
   */
  removeCurrentBreakpoint_() {
    const className = this.currentBreakpointClass();

    this.breakpoint_ = '';

    if (className) {
      this.removeClass(className);
    }
  }

  /**
   * Get or set breakpoints on the player.
   * 在播放器上获取或设置断点。
   * Calling this method with an object or `true` will remove any previous
   * custom breakpoints and start from the defaults again.
   * 使用对象或“true”调用此方法将删除以前的任何自定义断点，并重新从默认值开始。
   * @param  {Object|boolean} [breakpoints]
   *         If an object is given, it can be used to provide custom
   *         breakpoints. If `true` is given, will set default breakpoints.
   *         If this argument is not given, will simply return the current
   *         breakpoints.
   *
   * @param  {number} [breakpoints.tiny]
   *         The maximum width for the "vjs-layout-tiny" class.
   *
   * @param  {number} [breakpoints.xsmall]
   *         The maximum width for the "vjs-layout-x-small" class.
   *
   * @param  {number} [breakpoints.small]
   *         The maximum width for the "vjs-layout-small" class.
   *
   * @param  {number} [breakpoints.medium]
   *         The maximum width for the "vjs-layout-medium" class.
   *
   * @param  {number} [breakpoints.large]
   *         The maximum width for the "vjs-layout-large" class.
   *
   * @param  {number} [breakpoints.xlarge]
   *         The maximum width for the "vjs-layout-x-large" class.
   *
   * @param  {number} [breakpoints.huge]
   *         The maximum width for the "vjs-layout-huge" class.
   *
   * @return {Object}
   *         An object mapping breakpoint names to maximum width values.
   */
  breakpoints(breakpoints) {

    // Used as a getter.
    // 作为getter的用法
    if (breakpoints === undefined) {
      return assign(this.breakpoints_);
    }

    this.breakpoint_ = '';
    this.breakpoints_ = assign({}, DEFAULT_BREAKPOINTS, breakpoints);

    // When breakpoint definitions change, we need to update the currently
    // selected breakpoint.
    // 当断点定义发生变化时，我们需要更新当前选择的断点。
    this.updateCurrentBreakpoint_();

    // Clone the breakpoints before returning.
    // 在返回之前克隆断点。
    return assign(this.breakpoints_);
  }

  /**
   * Get or set a flag indicating whether or not this player should adjust
   * its UI based on its dimensions.
   * 获取或设置一个标志，该标志指示此播放器是否应根据其尺寸调整其UI。
   * @param  {boolean} value
   *         Should be `true` if the player should adjust its UI based on its
   *         dimensions; otherwise, should be `false`.
   *
   * @return {boolean}
   *         Will be `true` if this player should adjust its UI based on its
   *         dimensions; otherwise, will be `false`.
   */
  responsive(value) {

    // 当作gitter的用法
    if (value === undefined) {
      return this.responsive_;
    }

    value = Boolean(value);
    const current = this.responsive_;

    // 无事发生
    if (value === current) {
      return;
    }

    // The value actually changed, set it.
    // 实际值改变了，设置它。
    this.responsive_ = value;

    // Start listening for breakpoints and set the initial breakpoint if the
    // player is now responsive.
    // 开始监听断点，如果播放器现在有响应，则设置初始断点。
    if (value) {
      this.on('playerresize', this.updateCurrentBreakpoint_);
      this.updateCurrentBreakpoint_();

    // Stop listening for breakpoints if the player is no longer responsive.
    // 如果播放机不再响应，请停止侦听断点。
    } else {
      this.off('playerresize', this.updateCurrentBreakpoint_);
      this.removeCurrentBreakpoint_();
    }

    return value;
  }

  /**
   * Get current breakpoint name, if any.
   * 获取当前断点名称（如果有）。
   * @return {string}
   *         If there is currently a breakpoint set, returns a the key from the
   *         breakpoints object matching it. Otherwise, returns an empty string.
   */
  currentBreakpoint() {
    return this.breakpoint_;
  }

  /**
   * Get the current breakpoint class name.
   * 获取当前断点类名。
   * @return {string}
   *         The matching class name (e.g. `"vjs-layout-tiny"` or
   *         `"vjs-layout-large"`) for the current breakpoint. Empty string if
   *         there is no current breakpoint.
   */
  currentBreakpointClass() {
    return BREAKPOINT_CLASSES[this.breakpoint_] || '';
  }

  /**
   * An object that describes a single piece of media.
   * 描述单个媒体的对象。
   * Properties that are not part of this type description will be retained; so,
   * this can be viewed as a generic metadata storage mechanism as well.
   * 不属于此类型描述的属性将被保留；因此，这也可以看作是一种通用的元数据存储机制。
   * @see      {@link https://wicg.github.io/mediasession/#the-mediametadata-interface}
   * @typedef  {Object} Player~MediaObject
   *
   * @property {string} [album]
   *           Unused, except if this object is passed to the `MediaSession`
   *           API.
   *
   * @property {string} [artist]
   *           Unused, except if this object is passed to the `MediaSession`
   *           API.
   *
   * @property {Object[]} [artwork]
   *           Unused, except if this object is passed to the `MediaSession`
   *           API. If not specified, will be populated via the `poster`, if
   *           available.
   *
   * @property {string} [poster]
   *           URL to an image that will display before playback.
   *
   * @property {Tech~SourceObject|Tech~SourceObject[]|string} [src]
   *           A single source object, an array of source objects, or a string
   *           referencing a URL to a media source. It is _highly recommended_
   *           that an object or array of objects is used here, so that source
   *           selection algorithms can take the `type` into account.
   *
   * @property {string} [title]
   *           Unused, except if this object is passed to the `MediaSession`
   *           API.
   *
   * @property {Object[]} [textTracks]
   *           An array of objects to be used to create text tracks, following
   *           the {@link https://www.w3.org/TR/html50/embedded-content-0.html#the-track-element|native track element format}.
   *           For ease of removal, these will be created as "remote" text
   *           tracks and set to automatically clean up on source changes.
   *
   *           These objects may have properties like `src`, `kind`, `label`,
   *           and `language`, see {@link Tech#createRemoteTextTrack}.
   */

  /**
   * Populate the player using a {@link Player~MediaObject|MediaObject}.
   *
   * @param  {Player~MediaObject} media
   *         A media object.
   *
   * @param  {Function} ready
   *         A callback to be called when the player is ready.
   */
  loadMedia(media, ready) {
    if (!media || typeof media !== 'object') {
      return;
    }

    this.reset();

    // Clone the media object so it cannot be mutated from outside.
    // 克隆媒体对象，使其无法从外部更改。
    this.cache_.media = mergeOptions(media);

    const {artwork, poster, src, textTracks} = this.cache_.media;

    // If `artwork` is not given, create it using `poster`.
    // 如果没有指定“artwork”，请使用“poster”创建它。
    if (!artwork && poster) {
      this.cache_.media.artwork = [{
        src: poster,
        type: getMimetype(poster)
      }];
    }

    if (src) {
      this.src(src);
    }

    if (poster) {
      this.poster(poster);
    }

    if (Array.isArray(textTracks)) {
      textTracks.forEach(tt => this.addRemoteTextTrack(tt, false));
    }

    this.ready(ready);
  }

  /**
   * Get a clone of the current {@link Player~MediaObject} for this player.
   * 获取此播放机当前{@link Player~MediaObject}的克隆。
   * If the `loadMedia` method has not been used, will attempt to return a
   * {@link Player~MediaObject} based on the current state of the player.
   * 如果尚未使用“loadMedia”方法，将尝试根据播放机的当前状态返回{@link Player~MediaObject}。
   * @return {Player~MediaObject} zzf add
   */
  getMedia() {
    if (!this.cache_.media) {
      const poster = this.poster();
      const src = this.currentSources();
      const textTracks = Array.prototype.map.call(this.remoteTextTracks(), (tt) => ({
        kind: tt.kind,
        label: tt.label,
        language: tt.language,
        src: tt.src
      }));

      const media = {src, textTracks};

      if (poster) {
        media.poster = poster;
        media.artwork = [{
          src: media.poster,
          type: getMimetype(media.poster)
        }];
      }

      return media;
    }

    return mergeOptions(this.cache_.media);
  }

  /**
   * Gets tag settings
   * 获取标题是设置
   * @param {Element} tag
   *        The player tag
   *
   * @return {Object}
   *         An object containing all of the settings
   *         for a player tag
   */
  static getTagSettings(tag) {
    const baseOptions = {
      sources: [],
      tracks: []
    };

    const tagOptions = Dom.getAttributes(tag);
    const dataSetup = tagOptions['data-setup'];

    if (Dom.hasClass(tag, 'vjs-fill')) {
      tagOptions.fill = true;
    }
    if (Dom.hasClass(tag, 'vjs-fluid')) {
      tagOptions.fluid = true;
    }

    // Check if data-setup attr exists.
    // 检查数据设置属性是否存在。
    if (dataSetup !== null) {

      const [err, data] = safeParseTuple(dataSetup || '{}');

      if (err) {
        log.error(err);
      }
      assign(tagOptions, data);
    }

    assign(baseOptions, tagOptions);

    // 获取标记子项设置
    if (tag.hasChildNodes()) {
      const children = tag.childNodes;

      for (let i = 0, j = children.length; i < j; i++) {
        const child = children[i];
        // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
        const childName = child.nodeName.toLowerCase();

        if (childName === 'source') {
          baseOptions.sources.push(Dom.getAttributes(child));
        } else if (childName === 'track') {
          baseOptions.tracks.push(Dom.getAttributes(child));
        }
      }
    }

    return baseOptions;
  }

  /**
   * Determine whether or not flexbox is supported
   * 确定是否支持flexbox
   * @return {boolean}
   *         - true if flexbox is supported
   *         - false if flexbox is not supported
   */
  flexNotSupported_() {
    const elem = document.createElement('i');

    // Note: We don't actually use flexBasis (or flexOrder), but it's one of the more
    // common flex features that we can rely on when checking for flex support.
    // 注意：我们实际上并没有使用flexBasis（或flexOrder），但它是我们在检查flex支持时可以依赖的更常见的flex特性之一。
    return !('flexBasis' in elem.style ||
            'webkitFlexBasis' in elem.style ||
            'mozFlexBasis' in elem.style ||
            'msFlexBasis' in elem.style ||
            // IE10-specific (2012 flex spec), available for completeness
            'msFlexOrder' in elem.style);
  }

  /**
   * Set debug mode to enable/disable logs at info level.
   * 将调试模式设置为在信息级别启用/禁用日志。
   * @param {boolean} enabled zzf add
   * @return {any} zzf add
   * @fires Player#debugon
   * @fires Player#debugoff
   */
  debug(enabled) {
    if (enabled === undefined) {
      return this.debugEnabled_;
    }
    if (enabled) {
      this.trigger('debugon');
      this.previousLogLevel_ = this.log.level;
      this.log.level('debug');
      this.debugEnabled_ = true;
    } else {
      this.trigger('debugoff');
      this.log.level(this.previousLogLevel_);
      this.previousLogLevel_ = undefined;
      this.debugEnabled_ = false;
    }
  }
}

/**
 * Get the {@link VideoTrackList}
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist
 *
 * @return {VideoTrackList}
 *         the current video track list
 *
 * @method Player.prototype.videoTracks
 */

/**
 * Get the {@link AudioTrackList}
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist
 *
 * @return {AudioTrackList}
 *         the current audio track list
 *
 * @method Player.prototype.audioTracks
 */

/**
 * Get the {@link TextTrackList}
 *
 * @link http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
 *
 * @return {TextTrackList}
 *         the current text track list
 *
 * @method Player.prototype.textTracks
 */

/**
 * Get the remote {@link TextTrackList}
 *
 * @return {TextTrackList}
 *         The current remote text track list
 *
 * @method Player.prototype.remoteTextTracks
 */

/**
 * Get the remote {@link HtmlTrackElementList} tracks.
 *
 * @return {HtmlTrackElementList}
 *         The current remote text track element list
 *
 * @method Player.prototype.remoteTextTrackEls
 */

TRACK_TYPES.names.forEach(function(name) {
  const props = TRACK_TYPES[name];

  Player.prototype[props.getterName] = function() {
    if (this.tech_) {
      return this.tech_[props.getterName]();
    }

    // if we have not yet loadTech_, we create {video,audio,text}Tracks_
    // these will be passed to the tech during loading
    // 如果我们还没有加载tech，我们将创建{video，audio，text}曲目，这些曲目将在加载过程中传递给tech
    this[props.privateName] = this[props.privateName] || new props.ListClass();
    return this[props.privateName];
  };
});

/**
 * Get or set the `Player`'s crossorigin option. For the HTML5 player, this
 * sets the `crossOrigin` property on the `<video>` tag to control the CORS
 * behavior.
 * 获取或设置“Player”的crossorigin选项。对于HTML5播放器，这将在“<video>”标记上设置“crossOrigin”属性来控制CORS行为。
 * @see [Video Element Attributes]{@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-crossorigin}
 *
 * @param {string} [value]
 *        The value to set the `Player`'s crossorigin to. If an argument is
 *        given, must be one of `anonymous` or `use-credentials`.
 *
 * @return {string|undefined}
 *         - The current crossorigin value of the `Player` when getting.
 *         - undefined when setting
 */
Player.prototype.crossorigin = Player.prototype.crossOrigin;

/**
 * Global enumeration of players.
 * player的全局枚举。
 * The keys are the player IDs and the values are either the {@link Player}
 * instance or `null` for disposed players.
 * 键是播放器ID，值是{@link player}实例，对于已释放的播放器，值为“null”。
 * @type {Object}
 */
Player.players = {};

const navigator = window.navigator;

/*
 * Player instance options, surfaced using options
 * options = Player.prototype.options_
 * Make changes in options, not here.
 * 播放器实例选项，使用选项为Player.prototype.options\在这里，不要改变。
 * @type {Object}
 * @private
 */
Player.prototype.options_ = {
  // Default order of fallback technology
  // 回退技术默认顺序
  techOrder: Tech.defaultTechOrder_,

  html5: {},
  flash: {},

  // 默认不活跃计数器
  inactivityTimeout: 2000,

  // 默认倍数播放
  playbackRates: [],
  // Add playback rate selection by adding rates
  // 'playbackRates': [0.5, 1, 1.5, 2],
  liveui: false,

  // Included control sets
  // 包含的控制集
  children: [
    'mediaLoader',
    'posterImage',
    'textTrackDisplay',
    'loadingSpinner',
    'bigPlayButton',
    'liveTracker',
    'controlBar',
    'errorDisplay',
    'textTrackSettings',
    'resizeManager'
  ],

  language: navigator && (navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language) || 'en',

  // locales and their language translations
  // 区域设置及其语言翻译
  languages: {},

  // Default message to show when a video cannot be played.
  // 无法播放视频时显示的默认消息。
  notSupportedMessage: 'No compatible source was found for this media.',

  fullscreen: {
    options: {
      navigationUI: 'hide'
    }
  },

  breakpoints: {},
  responsive: false
};

[
  /**
   * Returns whether or not the player is in the "ended" state.
   * 返回播放机是否处于“结束”状态。
   * @return {Boolean} True if the player is in the ended state, false if not.
   * @method Player#ended
   */
  'ended',
  /**
   * Returns whether or not the player is in the "seeking" state.
   * 返回播放机是否处于“正在寻找”状态。
   * @return {Boolean} True if the player is in the seeking state, false if not.
   * @method Player#seeking
   */
  'seeking',
  /**
   * Returns the TimeRanges of the media that are currently available
   * for seeking to.
   * 返回当前可用于查找的媒体的时间范围。
   * @return {TimeRanges} the seekable intervals of the media timeline
   * @method Player#seekable
   */
  'seekable',
  /**
   * Returns the current state of network activity for the element, from
   * the codes in the list below.
   * 从下表中的代码返回元素的网络活动的当前状态。
   * - NETWORK_EMPTY (numeric value 0)
   *   The element has not yet been initialised. All attributes are in
   *   their initial states.
   * - NETWORK_IDLE (numeric value 1)
   *   The element's resource selection algorithm is active and has
   *   selected a resource, but it is not actually using the network at
   *   this time.
   * - NETWORK_LOADING (numeric value 2)
   *   The user agent is actively trying to download data.
   * - NETWORK_NO_SOURCE (numeric value 3)
   *   The element's resource selection algorithm is active, but it has
   *   not yet found a resource to use.
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#network-states
   * @return {number} the current network activity state
   * @method Player#networkState
   */
  'networkState',
  /**
   * Returns a value that expresses the current state of the element
   * with respect to rendering the current playback position, from the
   * codes in the list below.
   * 从下表中的代码返回一个值，该值表示元素相对于呈现当前播放位置的当前状态。
   * - HAVE_NOTHING (numeric value 0)
   *   No information regarding the media resource is available.
   * - HAVE_METADATA (numeric value 1)
   *   Enough of the resource has been obtained that the duration of the
   *   resource is available.
   * - HAVE_CURRENT_DATA (numeric value 2)
   *   Data for the immediate current playback position is available.
   * - HAVE_FUTURE_DATA (numeric value 3)
   *   Data for the immediate current playback position is available, as
   *   well as enough data for the user agent to advance the current
   *   playback position in the direction of playback.
   * - HAVE_ENOUGH_DATA (numeric value 4)
   *   The user agent estimates that enough data is available for
   *   playback to proceed uninterrupted.
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-readystate
   * @return {number} the current playback rendering state
   * @method Player#readyState
   */
  'readyState'
].forEach(function(fn) {
  Player.prototype[fn] = function() {
    return this.techGet_(fn);
  };
});

TECH_EVENTS_RETRIGGER.forEach(function(event) {
  Player.prototype[`handleTech${toTitleCase(event)}_`] = function() {
    return this.trigger(event);
  };
});

/**
 * Fired when the player has initial duration and dimension information
 * 当player有初始持续时间和维度信息时激发
 * @event Player#loadedmetadata
 * @type {EventTarget~Event}
 */

/**
 * Fired when the player has downloaded data at the current playback position
 * 当播放机在当前播放位置下载数据时激发
 * @event Player#loadeddata
 * @type {EventTarget~Event}
 */

/**
 * Fired when the current playback position has changed *
 * During playback this is fired every 15-250 milliseconds, depending on the
 * playback technology in use.
 * 当前播放位置在播放过程中发生更改时激发此选项每隔15-250毫秒激发一次，具体取决于所使用的播放技术。
 * @event Player#timeupdate
 * @type {EventTarget~Event}
 */

/**
 * Fired when the volume changes
 * 当音量改变时激发
 * @event Player#volumechange
 * @type {EventTarget~Event}
 */

/**
 * Reports whether or not a player has a plugin available.
 * 一个播放器是否有可用的插件。
 * This does not report whether or not the plugin has ever been initialized
 * on this player. For that, [usingPlugin]{@link Player#usingPlugin}.
 * 这不报告插件是否已经在这个播放器上初始化过。
 * @method Player#hasPlugin
 * @param  {string}  name
 *         The name of a plugin.
 *
 * @return {boolean}
 *         Whether or not this player has the requested plugin available.
 */

/**
 * Reports whether or not a player is using a plugin by name.
 * 按名称报告播放机是否正在使用插件。
 * For basic plugins, this only reports whether the plugin has _ever_ been
 * initialized on this player.
 * 对于基本插件，这只报告插件是否已经在这个播放器上初始化过。
 * @method Player#usingPlugin
 * @param  {string} name
 *         The name of a plugin.
 *
 * @return {boolean}
 *         Whether or not this player is using the requested plugin.
 */

Component.registerComponent('Player', Player);
export default Player;
