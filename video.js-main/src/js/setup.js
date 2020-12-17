/**
 * @file setup.js - Functions for setting up a player without
 * user interaction based on the data-setup `attribute` of the video tag.
 *
 * @module setup
 */
import * as Dom from './utils/dom';
import document from 'global/document';
import window from 'global/window';

let _windowLoaded = false;
let videojs;

/**
 * 在播放机启动时设置具有数据设置“attribute”的任何标记。
 */
const autoSetup = function() {

  // 在非浏览器环境中防止损坏，并选中全局自动设置选项。
  if (!Dom.isReal() || videojs.options.autoSetup === false) {
    return;
  }

  const vids = Array.prototype.slice.call(document.getElementsByTagName('video'));
  const audios = Array.prototype.slice.call(document.getElementsByTagName('audio'));
  const divs = Array.prototype.slice.call(document.getElementsByTagName('video-js'));
  const mediaEls = vids.concat(audios, divs);

  // 检查是否存在任何媒体元素
  if (mediaEls && mediaEls.length > 0) {

    for (let i = 0, e = mediaEls.length; i < e; i++) {
      const mediaEl = mediaEls[i];

      //检查元素是否存在，是否具有getAttribute 功能。
      if (mediaEl && mediaEl.getAttribute) {

        // 请确保尚未设置此player。
        if (mediaEl.player === undefined) {
          const options = mediaEl.getAttribute('data-setup');

          // 检查数据设置属性是否存在。
          // 我们只在他们添加了数据设置属性的情况下自动设置。
          if (options !== null) {
            // 新建视频.js实例。
            videojs(mediaEl);
          }
        }

      // 如果没有定义getAttribute，我们需要等待DOM。
      } else {
        autoSetupTimeout(1);
        break;
      }
    }

  // 找不到视频，所以请继续循环，除非页面加载完毕。
  } else if (!_windowLoaded) {
    autoSetupTimeout(1);
  }
};

/**
 * 在页面运行之前等待autoSetup。这会被叫来的
* autoSetup if“hasload”返回false。
 *
 * @param {number} wait
 *        How long to wait in ms
 *
 * @param {module:videojs} [vjs]
 *        The videojs library function
 */
function autoSetupTimeout(wait, vjs) {
  if (vjs) {
    videojs = vjs;
  }

  window.setTimeout(autoSetup, wait);
}

/**
 * 用于将窗口加载状态的内部跟踪设置为true。
 *
 * @private
 */
function setWindowLoaded() {
  _windowLoaded = true;
  window.removeEventListener('load', setWindowLoaded);
}

if (Dom.isReal()) {
  if (document.readyState === 'complete') {
    setWindowLoaded();
  } else {
    /**
     * 监听window上的load事件，并将 windowload设置为true。
     *
     * 我们在这里使用标准的事件侦听器，以避免在创建任何播放器之前增加GUID。
     *
     * @listens load
     */
    window.addEventListener('load', setWindowLoaded);
  }
}

/**
 * 检查窗口是否已加载
 * @return {boolean} zzf add
 */
const hasLoaded = function() {
  return _windowLoaded;
};

export {autoSetup, autoSetupTimeout, hasLoaded};
