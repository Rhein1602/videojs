/**
 * @file text-track-settings.js
 */
import window from 'global/window';
import Component from '../component';
import ModalDialog from '../modal-dialog';
import {createEl} from '../utils/dom';
import * as Fn from '../utils/fn';
import * as Obj from '../utils/obj';
import log from '../utils/log';

const LOCAL_STORAGE_KEY = 'vjs-text-track-settings';

const COLOR_BLACK = ['#000', 'Black'];
const COLOR_BLUE = ['#00F', 'Blue'];
const COLOR_CYAN = ['#0FF', 'Cyan'];
const COLOR_GREEN = ['#0F0', 'Green'];
const COLOR_MAGENTA = ['#F0F', 'Magenta'];
const COLOR_RED = ['#F00', 'Red'];
const COLOR_WHITE = ['#FFF', 'White'];
const COLOR_YELLOW = ['#FF0', 'Yellow'];

const OPACITY_OPAQUE = ['1', 'Opaque'];
const OPACITY_SEMI = ['0.5', 'Semi-Transparent'];
const OPACITY_TRANS = ['0', 'Transparent'];

/**
 * Configuration for the various <select> elements in the DOM of this component.
 * 此组件DOM中各种<select>元素的配置。
 *
 * Possible keys include:
 *
 *`default`:
 *The default option index. Only needs to be provided if not zero.
 *`parser`:
 *A function which is used to parse the value from the selected option in
 *a customized way.
 *`selector`:
 *The selector used to find the associated <select> element.
 *
 * 可能的键包括：
 * "默认"
 * 默认选项索引。 如果不为零，仅需要提供
 * "解析器"
 * 一个函数，用于从中选择的选项解析值
 * "选择器"
 * 用于查找关联的<select>元素的选择器。
 */
const selectConfigs = {
  backgroundColor: {
    selector: '.vjs-bg-color > select',
    id: 'captions-background-color-%s',
    label: 'Color',
    options: [
      COLOR_BLACK,
      COLOR_WHITE,
      COLOR_RED,
      COLOR_GREEN,
      COLOR_BLUE,
      COLOR_YELLOW,
      COLOR_MAGENTA,
      COLOR_CYAN
    ]
  },

  backgroundOpacity: {
    selector: '.vjs-bg-opacity > select',
    id: 'captions-background-opacity-%s',
    label: 'Transparency',
    options: [
      OPACITY_OPAQUE,
      OPACITY_SEMI,
      OPACITY_TRANS
    ]
  },

  color: {
    selector: '.vjs-fg-color > select',
    id: 'captions-foreground-color-%s',
    label: 'Color',
    options: [
      COLOR_WHITE,
      COLOR_BLACK,
      COLOR_RED,
      COLOR_GREEN,
      COLOR_BLUE,
      COLOR_YELLOW,
      COLOR_MAGENTA,
      COLOR_CYAN
    ]
  },

  edgeStyle: {
    selector: '.vjs-edge-style > select',
    id: '%s',
    label: 'Text Edge Style',
    options: [
      ['none', 'None'],
      ['raised', 'Raised'],
      ['depressed', 'Depressed'],
      ['uniform', 'Uniform'],
      ['dropshadow', 'Dropshadow']
    ]
  },

  fontFamily: {
    selector: '.vjs-font-family > select',
    id: 'captions-font-family-%s',
    label: 'Font Family',
    options: [
      ['proportionalSansSerif', 'Proportional Sans-Serif'],
      ['monospaceSansSerif', 'Monospace Sans-Serif'],
      ['proportionalSerif', 'Proportional Serif'],
      ['monospaceSerif', 'Monospace Serif'],
      ['casual', 'Casual'],
      ['script', 'Script'],
      ['small-caps', 'Small Caps']
    ]
  },

  fontPercent: {
    selector: '.vjs-font-percent > select',
    id: 'captions-font-size-%s',
    label: 'Font Size',
    options: [
      ['0.50', '50%'],
      ['0.75', '75%'],
      ['1.00', '100%'],
      ['1.25', '125%'],
      ['1.50', '150%'],
      ['1.75', '175%'],
      ['2.00', '200%'],
      ['3.00', '300%'],
      ['4.00', '400%']
    ],
    default: 2,
    parser: (v) => v === '1.00' ? null : Number(v)
  },

  textOpacity: {
    selector: '.vjs-text-opacity > select',
    id: 'captions-foreground-opacity-%s',
    label: 'Transparency',
    options: [
      OPACITY_OPAQUE,
      OPACITY_SEMI
    ]
  },

  // Options for this object are defined below.
  windowColor: {
    selector: '.vjs-window-color > select',
    id: 'captions-window-color-%s',
    label: 'Color'
  },

  // Options for this object are defined below.
  windowOpacity: {
    selector: '.vjs-window-opacity > select',
    id: 'captions-window-opacity-%s',
    label: 'Transparency',
    options: [
      OPACITY_TRANS,
      OPACITY_SEMI,
      OPACITY_OPAQUE
    ]
  }
};

selectConfigs.windowColor.options = selectConfigs.backgroundColor.options;

/**
 * Get the actual value of an option.
 * 获取选择的实际价值。
 *
 * @param  {string} value
 *         The value to get
 *         获得的价值
 *
 * @param  {Function} [parser]
 *         Optional function to adjust the value.
 *         可选功能，用于调整值。
 *
 * @return {Mixed}
 *         - Will be `undefined` if no value exists
 *         - Will be `undefined` if the given value is "none".
 *         - Will be the actual value otherwise.
 *         -如果不存在值，则为`undefined`
 *         -如果给定值为“ none”，则将为“未定义”。
 *         -否则将为实际值。
 *
 * @private
 */
function parseOptionValue(value, parser) {
  if (parser) {
    value = parser(value);
  }

  if (value && value !== 'none') {
    return value;
  }
}

/**
 * Gets the value of the selected <option> element within a <select> element.
 * 获取<select>元素内所选<option>元素的值。
 *
 * @param  {Element} el
 *         the element to look in
 *         要看的元素
 *
 * @param  {Function} [parser]
 *         Optional function to adjust the value.
 *         可选功能，用于调整值。
 *
 * @return {Mixed}
 *         - Will be `undefined` if no value exists
 *         - Will be `undefined` if the given value is "none".
 *         - Will be the actual value otherwise.
 *          -如果不存在值，则为`undefined`
 *         -如果给定值为“ none”，则将为“未定义”。
 *         -否则将为实际值。
 *
 * @private
 */
function getSelectedOptionValue(el, parser) {
  const value = el.options[el.options.selectedIndex].value;

  return parseOptionValue(value, parser);
}

/**
 * Sets the selected <option> element within a <select> element based on a
 * given value.
 * 根据给定的值在<select>元素内设置选定的<option>元素。
 *
 * @param {Element} el
 *        The element to look in.
 *        要查找的元素。
 *
 * @param {string} value
 *        the property to look on.
 *        要查看的属性。
 *
 * @param {Function} [parser]
 *        Optional function to adjust the value before comparing.
 *        可选功能，用于在比较之前调整值。
 *
 * @private
 */
function setSelectedOption(el, value, parser) {
  if (!value) {
    return;
  }

  for (let i = 0; i < el.options.length; i++) {
    if (parseOptionValue(el.options[i].value, parser) === value) {
      el.selectedIndex = i;
      break;
    }
  }
}

/**
 * Manipulate Text Tracks settings.
 * 操纵文本轨道设置。
 *
 * @extends ModalDialog
 */
class TextTrackSettings extends ModalDialog {

  /**
   * Creates an instance of this class.
   * 创建此类的实例。
   *
   * @param {Player} player
   *         The `Player` that this class should be attached to.
   *         此类应附加到的“播放器”。
   *
   * @param {Object} [options]
   *         The key/value store of player options.
   *         玩家选项的键/值存储。
   */
  constructor(player, options) {
    options.temporary = false;

    super(player, options);
    this.updateDisplay = Fn.bind(this, this.updateDisplay);

    // fill the modal and pretend we have opened it
    this.fill();
    this.hasBeenOpened_ = this.hasBeenFilled_ = true;

    this.endDialog = createEl('p', {
      className: 'vjs-control-text',
      textContent: this.localize('End of dialog window.')
    });
    this.el().appendChild(this.endDialog);

    this.setDefaults();

    // Grab `persistTextTrackSettings` from the player options if not passed in child options
    // 如果未在子选项中传递，则从播放器选项中获取“ persistTextTrackSettings”
    if (options.persistTextTrackSettings === undefined) {
      this.options_.persistTextTrackSettings = this.options_.playerOptions.persistTextTrackSettings;
    }

    this.on(this.$('.vjs-done-button'), 'click', () => {
      this.saveSettings();
      this.close();
    });

    this.on(this.$('.vjs-default-button'), 'click', () => {
      this.setDefaults();
      this.updateDisplay();
    });

    Obj.each(selectConfigs, config => {
      this.on(this.$(config.selector), 'change', this.updateDisplay);
    });

    if (this.options_.persistTextTrackSettings) {
      this.restoreSettings();
    }
  }

  dispose() {
    this.endDialog = null;

    super.dispose();
  }

  /**
   * Create a <select> element with configured options.
   * 使用配置的选项创建一个<select>元素。
   *
   * @param {string} key
   *        Configuration key to use during creation.
   *        创建期间要使用的配置密钥。
   *
   * @param {String} legendId
   *        zzf add
   *
   *  @param {String} type
   *        zzf add
   *
   * @return {string}
   *         An HTML string.
   *
   * @private
   */
  createElSelect_(key, legendId = '', type = 'label') {
    const config = selectConfigs[key];
    const id = config.id.replace('%s', this.id_);
    const selectLabelledbyIds = [legendId, id].join(' ').trim();

    return [
      `<${type} id="${id}" class="${type === 'label' ? 'vjs-label' : ''}">`,
      this.localize(config.label),
      `</${type}>`,
      `<select aria-labelledby="${selectLabelledbyIds}">`
    ].
      concat(config.options.map(o => {
        const optionId = id + '-' + o[1].replace(/\W+/g, '');

        return [
          `<option id="${optionId}" value="${o[0]}" `,
          `aria-labelledby="${selectLabelledbyIds} ${optionId}">`,
          this.localize(o[1]),
          '</option>'
        ].join('');
      })).
      concat('</select>').join('');
  }

  /**
   * Create foreground color element for the component
   * 为组件创建前景色元素
   *
   * @return {string}
   *         An HTML string.
   *         HTML字符串。
   *
   * @private
   */
  createElFgColor_() {
    const legendId = `captions-text-legend-${this.id_}`;

    return [
      '<fieldset class="vjs-fg-color vjs-track-setting">',
      `<legend id="${legendId}">`,
      this.localize('Text'),
      '</legend>',
      this.createElSelect_('color', legendId),
      '<span class="vjs-text-opacity vjs-opacity">',
      this.createElSelect_('textOpacity', legendId),
      '</span>',
      '</fieldset>'
    ].join('');
  }

  /**
   * Create background color element for the component
   * 创建组件的背景色元素
   *
   * @return {string}
   *         An HTML string.
   *         HTML字符串。
   *
   * @private
   */
  createElBgColor_() {
    const legendId = `captions-background-${this.id_}`;

    return [
      '<fieldset class="vjs-bg-color vjs-track-setting">',
      `<legend id="${legendId}">`,
      this.localize('Background'),
      '</legend>',
      this.createElSelect_('backgroundColor', legendId),
      '<span class="vjs-bg-opacity vjs-opacity">',
      this.createElSelect_('backgroundOpacity', legendId),
      '</span>',
      '</fieldset>'
    ].join('');
  }

  /**
   * Create window color element for the component
   * 为组件创建窗口颜色元素
   *
   * @return {string}
   *         An HTML string.
   *         HTML字符串。
   *
   * @private
   */
  createElWinColor_() {
    const legendId = `captions-window-${this.id_}`;

    return [
      '<fieldset class="vjs-window-color vjs-track-setting">',
      `<legend id="${legendId}">`,
      this.localize('Window'),
      '</legend>',
      this.createElSelect_('windowColor', legendId),
      '<span class="vjs-window-opacity vjs-opacity">',
      this.createElSelect_('windowOpacity', legendId),
      '</span>',
      '</fieldset>'
    ].join('');
  }

  /**
   * Create color elements for the component
   * 为组件创建颜色元素
   *
   * @return {Element}
   *         The element that was created
   *         创建的元素
   *
   * @private
   */
  createElColors_() {
    return createEl('div', {
      className: 'vjs-track-settings-colors',
      innerHTML: [
        this.createElFgColor_(),
        this.createElBgColor_(),
        this.createElWinColor_()
      ].join('')
    });
  }

  /**
   * Create font elements for the component
   * 为组件创建字体元素
   *
   * @return {Element}
   *         The element that was created.
   *         创建的元素。
   *
   * @private
   */
  createElFont_() {
    return createEl('div', {
      className: 'vjs-track-settings-font',
      innerHTML: [
        '<fieldset class="vjs-font-percent vjs-track-setting">',
        this.createElSelect_('fontPercent', '', 'legend'),
        '</fieldset>',
        '<fieldset class="vjs-edge-style vjs-track-setting">',
        this.createElSelect_('edgeStyle', '', 'legend'),
        '</fieldset>',
        '<fieldset class="vjs-font-family vjs-track-setting">',
        this.createElSelect_('fontFamily', '', 'legend'),
        '</fieldset>'
      ].join('')
    });
  }

  /**
   * Create controls for the component
   * 为组件创建控件
   *
   * @return {Element}
   *         The element that was created.
   *         创建的元素。
   *
   * @private
   */
  createElControls_() {
    const defaultsDescription = this.localize('restore all settings to the default values');

    return createEl('div', {
      className: 'vjs-track-settings-controls',
      innerHTML: [
        `<button type="button" class="vjs-default-button" title="${defaultsDescription}">`,
        this.localize('Reset'),
        `<span class="vjs-control-text"> ${defaultsDescription}</span>`,
        '</button>',
        `<button type="button" class="vjs-done-button">${this.localize('Done')}</button>`
      ].join('')
    });
  }

  content() {
    return [
      this.createElColors_(),
      this.createElFont_(),
      this.createElControls_()
    ];
  }

  label() {
    return this.localize('Caption Settings Dialog');
  }

  description() {
    return this.localize('Beginning of dialog window. Escape will cancel and close the window.');
  }

  buildCSSClass() {
    return super.buildCSSClass() + ' vjs-text-track-settings';
  }

  /**
   * Gets an object of text track settings (or null).
   * 获取文本轨道设置的对象（或null）。
   *
   * @return {Object}
   *         An object with config values parsed from the DOM or localStorage.
   *         具有从DOM或localStorage解析的配置值的对象。
   */
  getValues() {
    return Obj.reduce(selectConfigs, (accum, config, key) => {
      const value = getSelectedOptionValue(this.$(config.selector), config.parser);

      if (value !== undefined) {
        accum[key] = value;
      }

      return accum;
    }, {});
  }

  /**
   * Sets text track settings from an object of values.
   * 从值对象设置文本轨道设置。
   *
   * @param {Object} values
   *        An object with config values parsed from the DOM or localStorage.
   *        具有从DOM或localStorage解析的配置值的对象。
   */
  setValues(values) {
    Obj.each(selectConfigs, (config, key) => {
      setSelectedOption(this.$(config.selector), values[key], config.parser);
    });
  }

  /**
   * Sets all `<select>` elements to their default values.
   * 将所有的<select>元素设置为其默认值。
   */
  setDefaults() {
    Obj.each(selectConfigs, (config) => {
      const index = config.hasOwnProperty('default') ? config.default : 0;

      this.$(config.selector).selectedIndex = index;
    });
  }

  /**
   * Restore texttrack settings from localStorage
   * 从localStorage恢复文本轨道设置
   */
  restoreSettings() {
    let values;

    try {
      values = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY));
    } catch (err) {
      log.warn(err);
    }

    if (values) {
      this.setValues(values);
    }
  }

  /**
   * Save text track settings to localStorage
   * 将文本音轨设置保存到localStorage
   */
  saveSettings() {
    if (!this.options_.persistTextTrackSettings) {
      return;
    }

    const values = this.getValues();

    try {
      if (Object.keys(values).length) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(values));
      } else {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (err) {
      log.warn(err);
    }
  }

  /**
   * Update display of text track settings
   * 更新文本轨道设置的显示
   */
  updateDisplay() {
    const ttDisplay = this.player_.getChild('textTrackDisplay');

    if (ttDisplay) {
      ttDisplay.updateDisplay();
    }
  }

  /**
   * conditionally blur the element and refocus the captions button
   * 有条件地模糊元素并重新调整字幕按钮
   *
   * @private
   */
  conditionalBlur_() {
    this.previouslyActiveEl_ = null;

    const cb = this.player_.controlBar;
    const subsCapsBtn = cb && cb.subsCapsButton;
    const ccBtn = cb && cb.captionsButton;

    if (subsCapsBtn) {
      subsCapsBtn.focus();
    } else if (ccBtn) {
      ccBtn.focus();
    }
  }

}

Component.registerComponent('TextTrackSettings', TextTrackSettings);

export default TextTrackSettings;
