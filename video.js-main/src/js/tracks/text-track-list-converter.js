/**
 * @file text-track-list-converter.js Utilities for capturing text track state and
 * re-creating tracks based on a capture.
 * text-track-list-converter.js捕获文本轨道状态并基于捕获重新创建轨道的实用程序。
 *
 * @module text-track-list-converter
 */

/**
 * Examine a single {@link TextTrack} and return a JSON-compatible javascript object that
 * represents the {@link TextTrack}'s state.
 * 检查单个{@link TextTrack}并返回一个表示JSON兼容的javascript对象，该对象表示{@link TextTrack}的状态。
 *
 * @param {TextTrack} track
 *        The text track to query.
 *        要查询的文本轨道。
 *
 * @return {Object}
 *         A serializable javascript representation of the TextTrack.
 *         TextTrack的可序列化javascript表示形式。
 * @private
 */
const trackToJson_ = function(track) {
  const ret = [
    'kind', 'label', 'language', 'id',
    'inBandMetadataTrackDispatchType', 'mode', 'src'
  ].reduce((acc, prop, i) => {

    if (track[prop]) {
      acc[prop] = track[prop];
    }

    return acc;
  }, {
    cues: track.cues && Array.prototype.map.call(track.cues, function(cue) {
      return {
        startTime: cue.startTime,
        endTime: cue.endTime,
        text: cue.text,
        id: cue.id
      };
    })
  });

  return ret;
};

/**
 * Examine a {@link Tech} and return a JSON-compatible javascript array that represents the
 * state of all {@link TextTrack}s currently configured. The return array is compatible with
 * {@link text-track-list-converter:jsonToTextTracks}.
 *
 * 检查一个{@link Tech}并返回一个JSON兼容的javascript数组，该数组表示当前配置的所有{@link TextTrack}的状态。
 * 返回数组与{@link text-track-list-converter：jsonToTextTracks}兼容。
 *
 * @param {Tech} tech
 *        The tech object to query
 *        要查询的技术对象
 *
 * @return {Array}
 *         A serializable javascript representation of the {@link Tech}s
 *         {@link TextTrackList}.
 *         {@link Tech} s的可序列化javascript表示形式
 */
const textTracksToJson = function(tech) {

  const trackEls = tech.$$('track');

  const trackObjs = Array.prototype.map.call(trackEls, (t) => t.track);
  const tracks = Array.prototype.map.call(trackEls, function(trackEl) {
    const json = trackToJson_(trackEl.track);

    if (trackEl.src) {
      json.src = trackEl.src;
    }
    return json;
  });

  return tracks.concat(Array.prototype.filter.call(tech.textTracks(), function(track) {
    return trackObjs.indexOf(track) === -1;
  }).map(trackToJson_));
};

/**
 * Create a set of remote {@link TextTrack}s on a {@link Tech} based on an array of javascript
 * object {@link TextTrack} representations.
 * 根据一组JavaScript对象{@link TextTrack}表示形式，在{@link Tech}上创建一组远程{@link TextTrack}。
 *
 * @param {Array} json
 *        An array of `TextTrack` representation objects, like those that would be
 *        produced by `textTracksToJson`.
 *        由TextTracks表示对象组成的数组，类似于由textTracksToJson产生的对象。
 *
 * @param {Tech} tech
 *        The `Tech` to create the `TextTrack`s on.
 *        用于创建TextTrack的技术。
 * @return {Function} zzf add
 */
const jsonToTextTracks = function(json, tech) {
  json.forEach(function(track) {
    const addedTrack = tech.addRemoteTextTrack(track).track;

    if (!track.src && track.cues) {
      track.cues.forEach((cue) => addedTrack.addCue(cue));
    }
  });

  return tech.textTracks();
};

export default {textTracksToJson, jsonToTextTracks, trackToJson_};
