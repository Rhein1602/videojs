/**
 * @file fullscreen-api.js
 * @module fullscreen-api
 * @private
 */
import document from 'global/document';

/**
 * Store the browser-specific methods for the fullscreen API.
 * 为全屏API存储特定于浏览器的方法。
 * @type {Object}
 * @see [Specification]{@link https://fullscreen.spec.whatwg.org}
 * @see [Map Approach From Screenfull.js]{@link https://github.com/sindresorhus/screenfull.js}
 */
const FullscreenApi = {
  prefixed: true
};

// browser API methods
// 浏览器API方法
const apiMap = [
  [
    'requestFullscreen',
    'exitFullscreen',
    'fullscreenElement',
    'fullscreenEnabled',
    'fullscreenchange',
    'fullscreenerror',
    'fullscreen'
  ],
  // WebKit
  [
    'webkitRequestFullscreen',
    'webkitExitFullscreen',
    'webkitFullscreenElement',
    'webkitFullscreenEnabled',
    'webkitfullscreenchange',
    'webkitfullscreenerror',
    '-webkit-full-screen'
  ],
  // Mozilla
  [
    'mozRequestFullScreen',
    'mozCancelFullScreen',
    'mozFullScreenElement',
    'mozFullScreenEnabled',
    'mozfullscreenchange',
    'mozfullscreenerror',
    '-moz-full-screen'
  ],
  // Microsoft
  [
    'msRequestFullscreen',
    'msExitFullscreen',
    'msFullscreenElement',
    'msFullscreenEnabled',
    'MSFullscreenChange',
    'MSFullscreenError',
    '-ms-fullscreen'
  ]
];

const specApi = apiMap[0];
let browserApi;

// determine the supported set of functions
// 确定支持的函数集
for (let i = 0; i < apiMap.length; i++) {
  // check for exitFullscreen function
  // 检查exitFullscreen功能
  if (apiMap[i][1] in document) {
    browserApi = apiMap[i];
    break;
  }
}

// map the browser API names to the spec API names
// 将浏览器API名称映射到规范API名称
if (browserApi) {
  for (let i = 0; i < browserApi.length; i++) {
    FullscreenApi[specApi[i]] = browserApi[i];
  }

  FullscreenApi.prefixed = browserApi[0] !== specApi[0];
}

export default FullscreenApi;
