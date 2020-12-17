/**
 * @file track-kinds.js
 */

/**
 * All possible `VideoTrackKind`s
 * 所有可能的`VideoTrackKind`s
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-kind
 * @typedef VideoTrack~Kind
 * @enum
 */
export const VideoTrackKind = {
  alternative: 'alternative',
  captions: 'captions',
  main: 'main',
  sign: 'sign',
  subtitles: 'subtitles',
  commentary: 'commentary'
};

/**
 * All possible `AudioTrackKind`s
 * 所有可能的`AudioTrackKind`s
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-kind
 * @typedef AudioTrack~Kind
 * @enum
 */
export const AudioTrackKind = {
  'alternative': 'alternative',
  'descriptions': 'descriptions',
  'main': 'main',
  'main-desc': 'main-desc',
  'translation': 'translation',
  'commentary': 'commentary'
};

/**
 * All possible `TextTrackKind`s
 * 所有可能的`TextTrackKind`s
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-texttrack-kind
 * @typedef TextTrack~Kind
 * @enum
 */
export const TextTrackKind = {
  subtitles: 'subtitles',
  captions: 'captions',
  descriptions: 'descriptions',
  chapters: 'chapters',
  metadata: 'metadata'
};

/**
 * All possible `TextTrackMode`s
 * 所有可能的`TextTrackMode`s
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackmode
 * @typedef TextTrack~Mode
 * @enum
 */
export const TextTrackMode = {
  disabled: 'disabled',
  hidden: 'hidden',
  showing: 'showing'
};
