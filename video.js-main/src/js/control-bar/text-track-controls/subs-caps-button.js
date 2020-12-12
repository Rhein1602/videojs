/**
 * @file sub-caps-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';
import CaptionSettingsMenuItem from './caption-settings-menu-item.js';
import SubsCapsMenuItem from './subs-caps-menu-item.js';
import {toTitleCase} from '../../utils/string-cases.js';
/**
 * The button component for toggling and selecting captions and/or subtitles
 *
 * @extends TextTrackButton
 */
class SubsCapsButton extends TextTrackButton {//extend from './text-track-button.js'

  constructor(player, options = {}) {//构造函数
    super(player, options);//(播放器，选项)

    // Although North America uses "captions" in most cases for
    // "captions and subtitles" other locales use "subtitles"
    this.label_ = 'subtitles';
    if (['en', 'en-us', 'en-ca', 'fr-ca'].indexOf(this.player_.language_) > -1) {//选择语言
      this.label_ = 'captions';
    }
    this.menuButton_.controlText(toTitleCase(this.label_));//import from '../../utils/string-cases.js'
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {//建立CSS
    return `vjs-subs-caps-button ${super.buildCSSClass()}`;
  }

  buildWrapperCSSClass() {//建立CSS包装类
    return `vjs-subs-caps-button ${super.buildWrapperCSSClass()}`;
  }

  /**
   * Create caption/subtitles menu items
   * 创建字幕清单
   *
   * @return {CaptionSettingsMenuItem[]}
   *         The array of current menu items.
   */
  createItems() {
    let items = [];

    if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks) &&
      this.player().getChild('textTrackSettings')) {
      items.push(new CaptionSettingsMenuItem(this.player_, {kind: this.label_}));//import from './caption-settings-menu-item.js'

      this.hideThreshold_ += 1;
    }

    items = super.createItems(items, SubsCapsMenuItem);//import from './subs-caps-menu-item.js'
    return items;
  }

}

/**
 * `kind`s of TextTrack to look for to associate it with this menu.
 * 要查找的文本轨道类型，以便将其与此菜单关联。
 *
 * @type {array}
 * @private
 */
SubsCapsButton.prototype.kinds_ = ['captions', 'subtitles'];

/**
 * The text that should display over the `SubsCapsButton`s controls.
 * 应显示在“SubsCapsButton”控件上的文本。
 *
 * @type {string}
 * @private
 */
SubsCapsButton.prototype.controlText_ = 'Subtitles';


/**
 * 注册组件为SubsCapsButton
 */
Component.registerComponent('SubsCapsButton', SubsCapsButton);//import from '../../component.js'
export default SubsCapsButton;
