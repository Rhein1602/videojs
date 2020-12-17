/**
 * @file plugin.js
 */
import evented from './mixins/evented';
import stateful from './mixins/stateful';
import * as Events from './utils/events';
import * as Fn from './utils/fn';
import log from './utils/log';
import Player from './player';

/**
 * 基本插件名称。
 *
 * @private
 * @constant
 * @type {string}
 */
const BASE_PLUGIN_NAME = 'plugin';

/**
 * 存储玩家活动插件缓存的密钥。
 *
 * @private
 * @constant
 * @type     {string}
 */
const PLUGIN_CACHE_KEY = 'activePlugins_';

/**
 * 将注册的插件存储在私有空间中。
 *
 * @private
 * @type    {Object}
 */
const pluginStorage = {};

/**
 * 报告插件是否已注册。
 *
 * @private
 * @param   {string} name
 *          The name of a plugin.
 *
 * @return {boolean}
 *          Whether or not the plugin has been registered.
 */
const pluginExists = (name) => pluginStorage.hasOwnProperty(name);

/**
 * 按名称获取一个注册的插件。
 *
 * @private
 * @param   {string} name
 *          The name of a plugin.
 *
 * @return {Function|undefined}
 *          The plugin (or undefined).
 */
const getPlugin = (name) => pluginExists(name) ? pluginStorage[name] : undefined;

/**
 * 在播放器上将插件标记为“活动”。
 *
 * 同时，确保播放器有一个跟踪活动插件的对象。
 *
 * @private
 * @param   {Player} player
 *          A Video.js player instance.
 *
 * @param   {string} name
 *          The name of a plugin.
 */
const markPluginAsActive = (player, name) => {
  player[PLUGIN_CACHE_KEY] = player[PLUGIN_CACHE_KEY] || {};
  player[PLUGIN_CACHE_KEY][name] = true;
};

/**
 * 触发一对插件安装事件。
 *
 * @private
 * @param  {Player} player
 *         A Video.js player instance.
 *
 * @param  {Plugin~PluginEventHash} hash
 *         A plugin event hash.
 *
 * @param  {boolean} [before]
 *         如果为true，则在事件名称前面加上“before”。换句话说，
 * 用这个来触发“beforepluginsetup”而不是“pluginsetup”。
 */
const triggerSetupEvent = (player, hash, before) => {
  const eventName = (before ? 'before' : '') + 'pluginsetup';

  player.trigger(eventName, hash);
  player.trigger(eventName + ':' + hash.name, hash);
};

/**
 * 一个基本的插件返回一个已经激活的插件函数。
 *
 * @private
 * @param   {string} name
 *          The name of the plugin.
 *
 * @param   {Function} plugin
 *          The basic plugin.
 *
 * @return {Function}
 *          A wrapper function for the given plugin.
 */
const createBasicPlugin = function(name, plugin) {
  const basicPluginWrapper = function() {

    // 我们在播放器上触发“beforepluginsetup”和“pluginsetup”事件，
    // 但是我们希望哈希值与为高级插件提供的哈希值一致。
    //
    // 这里唯一可能违反直觉的是“pluginsetup”事件中的“instance”是“plugin”函数返回的值。
    triggerSetupEvent(this, {name, plugin, instance: null}, true);

    const instance = plugin.apply(this, arguments);

    markPluginAsActive(this, name);
    triggerSetupEvent(this, {name, plugin, instance});

    return instance;
  };

  Object.keys(plugin).forEach(function(prop) {
    basicPluginWrapper[prop] = plugin[prop];
  });

  return basicPluginWrapper;
};

/**
 * 获取一个plugin子类并返回一个工厂函数来生成它的实例。
 *
 * This factory function will replace itself with an instance of the requested
 * sub-class of Plugin.
 *
 * @private
 * @param   {string} name
 *          The name of the plugin.
 *
 * @param   {Plugin} PluginSubClass
 *          The advanced plugin.
 *
 * @return {Function} zzf add
 */
const createPluginFactory = (name, PluginSubClass) => {

  // 向插件原型添加一个“name”属性，这样每个插件都可以通过名称引用自己。
  PluginSubClass.prototype.name = name;

  return function(...args) {
    triggerSetupEvent(this, {name, plugin: PluginSubClass, instance: null}, true);

    const instance = new PluginSubClass(...[this, ...args]);

    // 插件被返回当前实例的函数所取代。
    this[name] = () => instance;

    triggerSetupEvent(this, instance.getEventHash());

    return instance;
  };
};

/**
 * 所有高级插件的父类.
 *
 * @mixes   module:evented~EventedMixin
 * @mixes   module:stateful~StatefulMixin
 * @fires   Player#beforepluginsetup
 * @fires   Player#beforepluginsetup:$name
 * @fires   Player#pluginsetup
 * @fires   Player#pluginsetup:$name
 * @listens Player#dispose
 * @throws  {Error}
 *          If attempting to instantiate the base {@link Plugin} class
 *          directly instead of via a sub-class.
 */
class Plugin {

  /**
   * 创建此类的实例。
   *
   * Sub-classes should call `super` to ensure plugins are properly initialized.
   *
   * @param {Player} player
   *        A Video.js player instance.
   */
  constructor(player) {
    if (this.constructor === Plugin) {
      throw new Error('Plugin must be sub-classed; not directly instantiated.');
    }

    this.player = player;

    if (!this.log) {
      this.log = this.player.log.createLogger(this.name);
    }

    // 使此对象事件化，但删除添加的“trigger”方法，以便改用原型版本。
    evented(this);
    delete this.trigger;

    stateful(this, this.constructor.defaultState);
    markPluginAsActive(player, this.name);

    // 自动绑定dispose方法，以便我们可以将其用作侦听器，并在以后轻松地解除绑定。
    this.dispose = Fn.bind(this, this.dispose);

    // 如果player已释放，请释放插件。
    player.on('dispose', this.dispose);
  }

  /**
   * Get the version of the plugin that was set on <pluginName>.VERSION
   * @return {String} zzf add
   */
  version() {
    return this.constructor.VERSION;
  }

  /**
   * 插件触发的每个事件都包含一个具有常规属性的附加数据的哈希。
   *
   * This returns that object or mutates an existing hash.
   *
   * @param   {Object} [hash={}]
   *          An object to be used as event an event hash.
   *
   * @return {Plugin~PluginEventHash}
   *          An event hash object with provided properties mixed-in.
   */
  getEventHash(hash = {}) {
    hash.name = this.name;
    hash.plugin = this.constructor;
    hash.instance = this;
    return hash;
  }

  /**
   * 触发插件对象上的事件并重写
   * {@link module:evented~EventedMixin.trigger|EventedMixin.trigger}.
   *
   * @param   {string|Object} event
   *          An event type or an object with a type property.
   *
   * @param   {Object} [hash={}]
   *          Additional data hash to merge with a
   *          {@link Plugin~PluginEventHash|PluginEventHash}.
   *
   * @return {boolean}
   *          Whether or not default was prevented.
   */
  trigger(event, hash = {}) {
    return Events.trigger(this.eventBusEl_, event, this.getEventHash(hash));
  }

  /**
   * 处理插件上的“statechanged”事件。默认无操作，重写子类化。
   *
   * @abstract
   * @param    {Event} e
   *           An event object provided by a "statechanged" event.
   *
   * @param    {Object} e.changes
   *           An object describing changes that occurred with the "statechanged"
   *           event.
   */
  handleStateChanged(e) {}

  /**
   * 释放一个插件。
   *
   * Subclasses can override this if they want, but for the sake of safety,
   * it's probably best to subscribe the "dispose" event.
   *
   * @fires Plugin#dispose
   */
  dispose() {
    const {name, player} = this;

    /**
     *发出高级插件即将被释放的信号。
     *
     * @event Plugin#dispose
     * @type  {EventTarget~Event}
     */
    this.trigger('dispose');
    this.off();
    player.off('dispose', this.dispose);

    // Eliminate any possible sources of leaking memory by clearing up
    // references between the player and the plugin instance and nulling out
    // the plugin's state and replacing methods with a function that throws.
    player[PLUGIN_CACHE_KEY][name] = false;
    this.player = this.state = null;

    // 最后，用一个新的工厂替换播放器上的插件名
    // 这样插件就可以重新设置了。
    player[name] = createPluginFactory(name, pluginStorage[name]);
  }

  /**
   * 确定插件是否为基本插件（即不是“plugin”的子类）。
   *
   * @param   {string|Function} plugin
   *          If a string, matches the name of a plugin. If a function, will be
   *          tested directly.
   *
   * @return {boolean}
   *          Whether or not a plugin is a basic plugin.
   */
  static isBasic(plugin) {
    const p = (typeof plugin === 'string') ? getPlugin(plugin) : plugin;

    return typeof p === 'function' && !Plugin.prototype.isPrototypeOf(p.prototype);
  }

  /**
   * 注册video.js插件。
   *
   * @param   {string} name
   *          The name of the plugin to be registered. Must be a string and
   *          must not match an existing plugin or a method on the `Player`
   *          prototype.
   *
   * @param   {Function} plugin
   *          A sub-class of `Plugin` or a function for basic plugins.
   *
   * @return {Function}
   *          For advanced plugins, a factory function for that plugin. For
   *          basic plugins, a wrapper function that initializes the plugin.
   */
  static registerPlugin(name, plugin) {
    if (typeof name !== 'string') {
      throw new Error(`Illegal plugin name, "${name}", must be a string, was ${typeof name}.`);
    }

    if (pluginExists(name)) {
      log.warn(`A plugin named "${name}" already exists. You may want to avoid re-registering plugins!`);
    } else if (Player.prototype.hasOwnProperty(name)) {
      throw new Error(`Illegal plugin name, "${name}", cannot share a name with an existing player method!`);
    }

    if (typeof plugin !== 'function') {
      throw new Error(`Illegal plugin for "${name}", must be a function, was ${typeof plugin}.`);
    }

    pluginStorage[name] = plugin;

    // 为所有子类插件添加播放器原型方法 (but not for
    // the base Plugin class).
    if (name !== BASE_PLUGIN_NAME) {
      if (Plugin.isBasic(plugin)) {
        Player.prototype[name] = createBasicPlugin(name, plugin);
      } else {
        Player.prototype[name] = createPluginFactory(name, plugin);
      }
    }

    return plugin;
  }

  /**
   * 取消注册到视频.js插件。
   *
   * @param  {string} name
   *         The name of the plugin to be de-registered. Must be a string that
   *         matches an existing plugin.
   *
   * @throws {Error}
   *         If an attempt is made to de-register the base plugin.
   */
  static deregisterPlugin(name) {
    if (name === BASE_PLUGIN_NAME) {
      throw new Error('Cannot de-register base plugin.');
    }
    if (pluginExists(name)) {
      delete pluginStorage[name];
      delete Player.prototype[name];
    }
  }

  /**
   * 获取包含多个视频.js插件。
   *
   * @param   {Array} [names]
   *          If provided, should be an array of plugin names. Defaults to _all_
   *          plugin names.
   *
   * @return {Object|undefined}
   *          An object containing plugin(s) associated with their name(s) or
   *          `undefined` if no matching plugins exist).
   */
  static getPlugins(names = Object.keys(pluginStorage)) {
    let result;

    names.forEach(name => {
      const plugin = getPlugin(name);

      if (plugin) {
        result = result || {};
        result[name] = plugin;
      }
    });

    return result;
  }

  /**
   * 获取插件的版本（如果可用）
   *
   * @param   {string} name
   *          The name of a plugin.
   *
   * @return {string}
   *          The plugin's version or an empty string.
   */
  static getPluginVersion(name) {
    const plugin = getPlugin(name);

    return plugin && plugin.VERSION || '';
  }
}

/**
 * 按名称获取插件（如果存在）。
 *
 * @static
 * @method   getPlugin
 * @memberOf Plugin
 * @param    {string} name
 *           The name of a plugin.
 *
 * @returns  {Function|undefined}
 *           The plugin (or `undefined`).
 */
Plugin.getPlugin = getPlugin;

/**
 * 注册时基插件类的名称。
 *
 * @type {string}
 */
Plugin.BASE_PLUGIN_NAME = BASE_PLUGIN_NAME;

Plugin.registerPlugin(BASE_PLUGIN_NAME, Plugin);

/**
 * 记录在播放器.js
 *  @param {String} name zzf add
 *  @return {boolean} zzf add
 * @ignore
 */
Player.prototype.usingPlugin = function(name) {
  return !!this[PLUGIN_CACHE_KEY] && this[PLUGIN_CACHE_KEY][name] === true;
};

/**
 * 记录在播放器.js
 * @param {String} name zzf add
 *  @return {boolean} zzf add
 * @ignore
 */
Player.prototype.hasPlugin = function(name) {
  return !!pluginExists(name);
};

export default Plugin;

/**
 * 表示即将在播放器上设置插件。
 *
 * @event    Player#beforepluginsetup
 * @type     {Plugin~PluginEventHash}
 */

/**
 * 表示一个插件即将在一个播放器上按名称设置。name是插件的名称。
 *
 * @event    Player#beforepluginsetup:$name
 * @type     {Plugin~PluginEventHash}
 */

/**
 * 表示刚刚在播放器上设置了插件。
 *
 * @event    Player#pluginsetup
 * @type     {Plugin~PluginEventHash}
 */

/**
 * 表示一个插件刚刚被设置在一个播放器上-按名称。name是插件的名称。
 *
 * @event    Player#pluginsetup:$name
 * @type     {Plugin~PluginEventHash}
 */

/**
 * @typedef  {Object} Plugin~PluginEventHash
 *
 * @property {string} instance
 *           For basic plugins, the return value of the plugin function. For
 *           advanced plugins, the plugin instance on which the event is fired.
 *
 * @property {string} name
 *           The name of the plugin.
 *
 * @property {string} plugin
 *           For basic plugins, the plugin function. For advanced plugins, the
 *           plugin class/constructor.
 */
