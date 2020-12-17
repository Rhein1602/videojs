/**
 * @file audio-track-menu-item.js
 */
import MenuItem from '../../menu/menu-item.js';
import Component from '../../component.js';
import {assign} from '../../utils/obj';

/**
 * An {@link AudioTrack} {@link MenuItem}
 *
 * @extends MenuItem
 */
class AudioTrackMenuItem extends MenuItem {

  /**
   * 创建此类的实例。
   *
   * @param {Player} player
   *        该类应附加到的“玩家”。
   *
   * @param {Object} [options]
   *        玩家选项的键/值存储。
   */
  constructor(player, options) {
    const track = options.track;
    const tracks = player.audioTracks();

    // 修改父MenuItem类的初始化选项。
    options.label = track.label || track.language || 'Unknown';
    options.selected = track.enabled;

    super(player, options);

    this.track = track;

    this.addClass(`vjs-${track.kind}-menu-item`);

    const changeHandler = (...args) => {
      this.handleTracksChange.apply(this, args);
    };

    tracks.addEventListener('change', changeHandler);
    this.on('dispose', () => {
      tracks.removeEventListener('change', changeHandler);
    });
  }

  createEl(type, props, attrs) {
    let innerHTML = `<span class="vjs-menu-item-text">${this.localize(this.options_.label)}`;

    if (this.options_.track.kind === 'main-desc') {
      innerHTML += `
        <span aria-hidden="true" class="vjs-icon-placeholder"></span>
        <span class="vjs-control-text"> ${this.localize('Descriptions')}</span>
      `;
    }

    innerHTML += '</span>';

    const el = super.createEl(type, assign({
      innerHTML
    }, props), attrs);

    return el;
  }

  /**
   * 当“点击”一个音频跟踪菜单项时，就会调用这个函数。See {@link ClickableComponent}
   * 有关点击的更多详细信息，
   *
   * @param {EventTarget~Event} [event]
   *        导致此函数被调用的“按键”、“点击”或“点击”事件。
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    const tracks = this.player_.audioTracks();

    super.handleClick(event);

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      track.enabled = track === this.track;
    }
  }

  /**
   * Handle any {@link AudioTrack} change.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link AudioTrackList#change} event that caused this to run.
   *
   * @listens AudioTrackList#change
   */
  handleTracksChange(event) {
    this.selected(this.track.enabled);
  }
}

Component.registerComponent('AudioTrackMenuItem', AudioTrackMenuItem);
export default AudioTrackMenuItem;
