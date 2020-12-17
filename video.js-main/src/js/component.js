/**
 * Player Component - Base class for all UI objects
 *
 * @file component.js
 */
import window from 'global/window';
import evented from './mixins/evented';
import stateful from './mixins/stateful';
import * as Dom from './utils/dom.js';
import DomData from './utils/dom-data';
import * as Fn from './utils/fn.js';
import * as Guid from './utils/guid.js';
import {toTitleCase, toLowerCase} from './utils/string-cases.js';
import mergeOptions from './utils/merge-options.js';
import computedStyle from './utils/computed-style';
import Map from './utils/map.js';
import Set from './utils/set.js';
import console from 'global/console';

/**
 * Base class for all UI Components.
 * Components are UI objects which represent both a javascript object and an element
 * in the DOM. They can be children of other components, and can have
 * children themselves.
 *所有UI组件的基类。
 *组件是表示javascript对象和元素的UI对象
 *在DOM内，它们可以是其他组件的children，并且自己也可以包含children。
 *
 * Components can also use methods from {@link EventTarget}
 */
class Component {

  /**
   * A callback that is called when a component is ready. Does not have any
   * paramters and any callback value will be ignored.
   *
   * 当组件准备就绪时调用的回调。没有任何参数和任何回调值都将被忽略。
   *
   * @callback Component~ReadyCallback
   * @this Component
   */

  /**
   * Creates an instance of this class.
   *创建类实例
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Object[]} [options.children]
   *        An array of children objects to intialize this component with. Children objects have
   *        a name property that will be used if more than one component of the same type needs to be
   *        added.
   *
   * @param {Component~ReadyCallback} [ready]
   *        Function that gets called when the `Component` is ready.
   */
  constructor(player, options, ready) {

    // 成分可能是player本身，我们不能把这个传给super
    if (!player && this.play) {
      this.player_ = player = this; // eslint-disable-line
    } else {
      this.player_ = player;
    }

    this.isDisposed_ = false;

    // 通过“addChild”方法保留对父组件的引用
    this.parentComponent_ = null;

    // 复制prototype.options\防止覆盖默认值
    this.options_ = mergeOptions({}, this.options_);

    // 更新了带有所提供选项的选项
    options = this.options_ = mergeOptions(this.options_, options);

    // 从options或options元素获取ID（如果提供了）
    this.id_ = options.id || (options.el && options.el.id);

    // 如果选项中没有ID，请生成一个
    if (!this.id_) {
      // 在模拟player的情况下，不需要player ID函数
      const id = player && player.id && player.id() || 'no_player';

      this.id_ = `${id}_component_${Guid.newGUID()}`;
    }

    this.name_ = options.name || null;

    // 如果选项中没有提供元素，则创建元素
    if (options.el) {
      this.el_ = options.el;
    } else if (options.createEl !== false) {
      this.el_ = this.createEl();
    }

    // 如果evented不是false，我们想在evented中混入
    if (options.evented !== false) {
      // 将此对象设为事件对象，并使用“el”作为其事件总线（如果可用）
      evented(this, {eventBusKey: this.el_ ? 'el_' : null});

      this.handleLanguagechange = this.handleLanguagechange.bind(this);
      this.on(this.player_, 'languagechange', this.handleLanguagechange);
    }
    stateful(this, this.constructor.defaultState);

    this.children_ = [];
    this.childIndex_ = {};
    this.childNameIndex_ = {};

    this.setTimeoutIds_ = new Set();
    this.setIntervalIds_ = new Set();
    this.rafIds_ = new Set();
    this.namedRafs_ = new Map();
    this.clearingTimersOnDispose_ = false;

    // 在选项中添加任何子组件
    if (options.initChildren !== false) {
      this.initChildren();
    }

    this.ready(ready);
    // 不要在这里触发，否则它会在init真正开始之前就触发
    // 运行此构造函数的所有子部件已完成

    if (options.reportTouchActivity !== false) {
      this.enableTouchActivity();
    }

  }

  /**
   * 处理“Component”和所有子组件。
   *
   * @fires Component#dispose
   */
  dispose() {

    // 如果部件已被处理，则应进行保释。
    if (this.isDisposed_) {
      return;
    }

    /**
     * 释放“Component”时触发。
     *
     * @event Component#dispose
     * @type {EventTarget~Event}
     *
     * @property {boolean} [bubbles=false]
     *           set to false so that the dispose event does not
     *           bubble up
     */
    this.trigger({type: 'dispose', bubbles: false});

    this.isDisposed_ = true;

    // 处理所有子组件
    if (this.children_) {
      for (let i = this.children_.length - 1; i >= 0; i--) {
        if (this.children_[i].dispose) {
          this.children_[i].dispose();
        }
      }
    }

    // 删除子引用
    this.children_ = null;
    this.childIndex_ = null;
    this.childNameIndex_ = null;

    this.parentComponent_ = null;

    if (this.el_) {
      // 从DOM中删除元素
      if (this.el_.parentNode) {
        this.el_.parentNode.removeChild(this.el_);
      }

      if (DomData.has(this.el_)) {
        DomData.delete(this.el_);
      }
      this.el_ = null;
    }

    // 处理元素后删除对播放器的引用
    this.player_ = null;
  }

  /**
   * Determine whether or not this component has been disposed.
   *  确定此组件是否已被释放。
   * @return {boolean}
   *         If the component has been disposed, will be `true`. Otherwise, `false`.
   */
  isDisposed() {
    return Boolean(this.isDisposed_);
  }

  /**
   * Return the {@link Player} that the `Component` has attached to.
   *  返回“Component”引用到的{@link Player}
   * @return {Player}
   *         The player that this `Component` has attached to.
   */
  player() {
    return this.player_;
  }

  /**
   * Deep merge of options objects with new options.
   * 选项对象与新选项的深度合并。
   * > Note: When both `obj` and `options` contain properties whose values are objects.
   *         The two properties get merged using {@link module:mergeOptions}
   *
   * @param {Object} obj
   *        The object that contains new options.
   *        包含新选项的对象。
   *
   * @return {Object}
   *         A new object of `this.options_` and `obj` merged together.
   *          新对象的选项和“obj”的合并在一起。
   */
  options(obj) {
    if (!obj) {
      return this.options_;
    }

    this.options_ = mergeOptions(this.options_, obj);
    return this.options_;
  }

  /**
   * Get the `Component`s DOM element
   *  获取`Component`DOM元素
   * @return {Element}
   *         The DOM element for this `Component`.
   */
  el() {
    return this.el_;
  }

  /**
   * Create the `Component`s DOM element.
   *创建`Component`DOM元素。
   * @param {string} [tagName]
   *        Element's DOM node type. e.g. 'div'
   *
   * @param {Object} [properties]
   *        An object of properties that should be set.
   *
   * @param {Object} [attributes]
   *        An object of attributes that should be set.
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl(tagName, properties, attributes) {
    return Dom.createEl(tagName, properties, attributes);
  }

  /**
   * Localize a string given the string in english.
   *  用英语将字符串本地化。
   * 
   * If tokens are provided, it'll try and run a simple token replacement on the provided string.
   * The tokens it looks for look like `{1}` with the index being 1-indexed into the tokens array.
   * 如果提供了令牌，它将尝试在提供的字符串上运行一个简单的令牌替换。
   * 它查找的标记看起来像{1}'，索引被1索引到令牌数组中。
   *
   * If a `defaultValue` is provided, it'll use that over `string`,
   * if a value isn't found in provided language files.
   * This is useful if you want to have a descriptive key for token replacement
   * but have a succinct localized string and not require `en.json` to be included.
   * 如果提供了“defaultValue”，它将在“string”上使用它，
   * 如果在提供的语言文件中找不到值。
   * 如果您希望有一个用于令牌替换的描述性密钥，这很有用
   * 但有一个简洁的本地化字符串，不需要`英语.json`包括在内。
   * 
   * Currently, it is used for the progress bar timing.
   * ```js
   * {
   *   "progress bar timing: currentTime={1} duration={2}": "{1} of {2}"
   * }
   * ```
   * It is then used like so:
   * ```js
   * this.localize('progress bar timing: currentTime={1} duration{2}',
   *               [this.player_.currentTime(), this.player_.duration()],
   *               '{1} of {2}');
   * ```
   *
   * Which outputs something like: `01:23 of 24:56`.
   *
   *
   * @param {string} string
   *        The string to localize and the key to lookup in the language files.
   * 语言文件中要本地化的字符串和要查找的键。
   * @param {string[]} [tokens]
   *        If the current item has token replacements, provide the tokens here.
   * 如果当前项有令牌替换，请在此处提供令牌。
   * @param {string} [defaultValue]
   *        Defaults to `string`. Can be a default value to use for token replacement
   *        if the lookup key is needed to be separate.
   * 默认为“string”。可以是用于令牌替换的默认值
   * 如果查找键需要分开。
   * @return {string}
   *         The localized string or if no localization exists the english string.
   */
  localize(string, tokens, defaultValue = string) {

    const code = this.player_.language && this.player_.language();
    const languages = this.player_.languages && this.player_.languages();
    const language = languages && languages[code];
    const primaryCode = code && code.split('-')[0];
    const primaryLang = languages && languages[primaryCode];

    let localizedString = defaultValue;

    if (language && language[string]) {
      localizedString = language[string];
    } else if (primaryLang && primaryLang[string]) {
      localizedString = primaryLang[string];
    }

    if (tokens) {
      localizedString = localizedString.replace(/\{(\d+)\}/g, function(match, index) {
        const value = tokens[index - 1];
        let ret = value;

        if (typeof value === 'undefined') {
          ret = match;
        }

        return ret;
      });
    }

    return localizedString;
  }

  /**
   * Handles language change for the player in components. Should be overriden by sub-components.
   * 处理组件中播放器的语言更改。应该被子组件覆盖。
   * @abstract
   */
  handleLanguagechange() {}

  /**
   * Return the `Component`s DOM element. This is where children get inserted.
   * This will usually be the the same as the element returned in {@link Component#el}.
   * 返回`Component`DOM元素。这是child被插入的地方。
   * 这通常与{@link Component#el}中返回的元素相同
   * @return {Element}
   *         The content element for this `Component`.
   */
  contentEl() {
    return this.contentEl_ || this.el_;
  }

  /**
   * 获取此组件的ID
   *
   * @return {string}
   *         The id of this `Component`
   */
  id() {
    return this.id_;
  }

  /**
   * 获取组件的名称。该名称用于引用
   * 并在注册期间设置。
   *
   * @return {string}
   *         The name of this `Component`.
   */
  name() {
    return this.name_;
  }

  /**
   * 获取所有子组件的数组
   *
   * @return {Array}
   *         The children
   */
  children() {
    return this.children_;
  }

  /**
   * 返回具有给定“id”的子“Component”。
   *
   * @param {string} id
   *       要获取的子“Component”的id。
   *
   * @return {Component|undefined}
   *         具有给定“id”或未定义的子“Component”。
   */
  getChildById(id) {
    return this.childIndex_[id];
  }

  /**
   * 返回具有给定“name”的子“Component”。
   *
   * @param {string} name
   *        要获取的子“Component”的名称。
   *
   * @return {Component|undefined}
   *         具有给定“name”或未定义的子“Component”。
   */
  getChild(name) {
    if (!name) {
      return;
    }

    return this.childNameIndex_[name];
  }

  /**
   * 返回给定项之后的子代“Component”后代的“names”。
   * 例如['foo'、'bar'、'baz']会尝试在当前组件上获取“foo”，在“foo”上获取“bar”
   * 
   * 如果这些都不存在，组件和“bar”组件上的“baz”，并返回undefined
   * 
   *
   * @param {...string} names
   *        The name of the child `Component` to get.
   *
   * @return {Component|undefined}
   *         The descendant `Component` following the given descendant
   *         `names` or undefined.
   */
  getDescendant(...names) {
    // 将数组参数展平到主数组中
    names = names.reduce((acc, n) => acc.concat(n), []);

    let currentChild = this;

    for (let i = 0; i < names.length; i++) {
      currentChild = currentChild.getChild(names[i]);

      if (!currentChild || !currentChild.getChild) {
        return;
      }
    }

    return currentChild;
  }

  /**
   * 在当前“Component”中添加子“Component”。
   *
   *
   * @param {string|Component} child
   *        The name or instance of a child to add.
   *
   * @param {Object} [options={}]
   *        The key/value store of options that will get passed to children of
   *        the child.
   *
   * @param {number} [index=this.children_.length]
   *        The index to attempt to add a child into.
   *
   * @return {Component}
   *         The `Component` that gets added as a child. When using a string the
   *         `Component` will get created by this process.
   */
  addChild(child, options = {}, index = this.children_.length) {
    // console.log('add child');

    let component;
    let componentName;

    // 如果child是字符串，请使用选项创建组件
    if (typeof child === 'string') {
      componentName = toTitleCase(child);

      const componentClassName = options.componentClass || componentName;

      // 通过选项设置名称
      options.name = componentName;

      // 为此控件集创建新的对象元素（&amp;E）
      // If there's no .player_, this is a player
      const ComponentClass = Component.getComponent(componentClassName);

      if (!ComponentClass) {
        throw new Error(`Component ${componentClassName} does not exist`);
      }

      // 直接存储在videojs对象上的数据可能被错误地标识为组件，以保持与4.x的向后兼容性。请检查以确保组件类可以实例化
      if (typeof ComponentClass !== 'function') {
        return null;
      }

      component = new ComponentClass(this.player_ || this, options);

    // 子对象是组件实例
    } else {
      component = child;
    }

    if (component.parentComponent_) {
      component.parentComponent_.removeChild(component);
    }
    this.children_.splice(index, 0, component);
    component.parentComponent_ = this;

    if (typeof component.id === 'function') {
      this.childIndex_[component.id()] = component;
    }

    // 如果没有使用名称来创建组件，请检查是否可以使用组件的名称函数
    componentName = componentName || (component.name && toTitleCase(component.name()));

    if (componentName) {
      this.childNameIndex_[componentName] = component;
      this.childNameIndex_[toLowerCase(componentName)] = component;
    }

    // 将UI对象的元素添加到容器div (box)
    // 不需要元素
    if (typeof component.el === 'function' && component.el()) {
      // 如果在组件之前插入，请在该组件的元素之前插入
      let refNode = null;

      if (this.children_[index + 1]) {
        // 大多数子元素是组件，但是视频技术是一个HTML元素
        if (this.children_[index + 1].el_) {
          refNode = this.children_[index + 1].el_;
        } else if (Dom.isEl(this.children_[index + 1])) {
          refNode = this.children_[index + 1];
        }
      }

      this.contentEl().insertBefore(component.el(), refNode);
    }

    // 返回，以便在需要时将其存储在父对象上。
    return component;
  }

  /**
   * 从“Component”的子列表中删除子“Component”。
   * 还将子“Component”的元素从此“Component”的元素中删除。
   *
   * @param {Component} component
   *        The child `Component` to remove.
   */
  removeChild(component) {
    if (typeof component === 'string') {
      component = this.getChild(component);
    }

    if (!component || !this.children_) {
      return;
    }

    let childFound = false;

    for (let i = this.children_.length - 1; i >= 0; i--) {
      if (this.children_[i] === component) {
        childFound = true;
        this.children_.splice(i, 1);
        break;
      }
    }

    if (!childFound) {
      return;
    }

    component.parentComponent_ = null;

    this.childIndex_[component.id()] = null;
    this.childNameIndex_[toTitleCase(component.name())] = null;
    this.childNameIndex_[toLowerCase(component.name())] = null;

    const compEl = component.el();

    if (compEl && compEl.parentNode === this.contentEl()) {
      this.contentEl().removeChild(component.el());
    }
  }

  /**
   * 根据选项添加和初始化默认子组件。.
   */
  initChildren() {
    const children = this.options_.children;

    if (children) {
      // `this` is `parent`
      const parentOptions = this.options_;

      const handleAdd = (child) => {
        const name = child.name;
        let opts = child.opts;

        // 允许在父选项中设置子级的选项
        // e.g. videojs(id, { controlBar: false });
        // instead of videojs(id, { children: { controlBar: false });
        if (parentOptions[name] !== undefined) {
          opts = parentOptions[name];
        }

        // 允许禁用默认组件
        // e.g. options['children']['posterImage'] = false
        if (opts === false) {
          return;
        }

        // Allow options to be passed as a simple boolean if no configuration is necessary.
        // 如果不需要配置，则允许将选项作为简单布尔值传递。
        if (opts === true) {
          opts = {};
        }

        // 我们还希望将原始的播放器选项传递给每个组件，这样它们就不需要在以后回到播放器中获取选项。
        opts.playerOptions = this.options_.playerOptions;

        // 创建并添加子组件。在父实例上按名称添加对子级的直接引用。如果使用两个相同的组件，则应为每个组件提供不同的名称
        const newChild = this.addChild(name, opts);

        if (newChild) {
          this[name] = newChild;
        }
      };

      // 允许在选项中传递子详细信息数组
      let workingChildren;
      const Tech = Component.getComponent('Tech');

      if (Array.isArray(children)) {
        workingChildren = children;
      } else {
        workingChildren = Object.keys(children);
      }

      workingChildren
      // children that are in this.options_ but also in workingChildren  would
      // give us extra children we do not want. So, we want to filter them out.
        .concat(Object.keys(this.options_)
          .filter(function(child) {
            return !workingChildren.some(function(wchild) {
              if (typeof wchild === 'string') {
                return child === wchild;
              }
              return child === wchild.name;
            });
          }))
        .map((child) => {
          let name;
          let opts;

          if (typeof child === 'string') {
            name = child;
            opts = children[name] || this.options_[name] || {};
          } else {
            name = child.name;
            opts = child;
          }

          return {name, opts};
        })
        .filter((child) => {
        // 我们必须确保子级名称不在techOrder中，因为techs注册为组件，但不兼容
        // See https://github.com/videojs/video.js/issues/2772
          const c = Component.getComponent(child.opts.componentClass ||
                                       toTitleCase(child.name));

          return c && !Tech.isTech(c);
        })
        .forEach(handleAdd);
    }
  }

  /**
   * Builds the default DOM class name. Should be overriden by sub-components.
   * 生成默认的DOM类名。应该被子组件覆盖。
   * @return {string}
   *         The DOM class name for this object.
   *
   * @abstract
   */
  buildCSSClass() {
    // 子类可以包含一个函数：
    // return 'CLASS NAME' + this._super();
    return '';
  }

  /**
   * 将侦听器绑定到组件的就绪状态。与事件侦听器不同的是，如果就绪事件已经发生，它将立即触发函数。
   *@param {Fn} fn
   *         the fn
   *@param {boolean} sync
   *        the sync
   *
   *
   */
  ready(fn, sync = false) {
    if (!fn) {
      return;
    }

    if (!this.isReady_) {
      this.readyQueue_ = this.readyQueue_ || [];
      this.readyQueue_.push(fn);
      return;
    }

    if (sync) {
      fn.call(this);
    } else {
      // 为保持一致性，默认情况下异步调用函数
      this.setTimeout(fn, 1);
    }
  }

  /**
   * 触发此“组件”的所有就绪侦听器。
   *
   * @fires Component#ready
   */
  triggerReady() {
    this.isReady_ = true;

    // 确保以异步方式触发就绪
    this.setTimeout(function() {
      const readyQueue = this.readyQueue_;

      // 重置就绪队列
      this.readyQueue_ = [];

      if (readyQueue && readyQueue.length > 0) {
        readyQueue.forEach(function(fn) {
          fn.call(this);
        }, this);
      }

      // 也允许使用事件侦听器
      /**
       * 当“Component”就绪时触发.
       *
       * @event Component#ready
       * @type {EventTarget~Event}
       */
      this.trigger('ready');
    }, 1);
  }

  /**
   * 寻找与“selector”匹配的单个DOM元素。这可以在“Component”中
   * `contentEl（）`或其他自定义上下文。
   *
   * @param {string} selector
   *        一个有效的CSS选择器，它将传递给“querySelector”。
   *
   * @param {Element|string} [context=this.contentEl()]
   *        A DOM element within which to query. Can also be a selector string in
   *        which case the first matching element will get used as context. If
   *        missing `this.contentEl()` gets used. If  `this.contentEl()` returns
   *        nothing it falls back to `document`.
   *
   * @return {Element|null}
   *         the dom element that was found, or null
   *
   * @see [Information on CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
   */
  $(selector, context) {
    return Dom.$(selector, context || this.contentEl());
  }

  /**
   * 查找与“selector”匹配的所有DOM元素。这可以在“Component”中
   * `contentEl（）`或其他自定义上下文。
   *
   * @param {string} selector
   *        A valid CSS selector, which will be passed to `querySelectorAll`.
   *
   * @param {Element|string} [context=this.contentEl()]
   *        A DOM element within which to query. Can also be a selector string in
   *        which case the first matching element will get used as context. If
   *        missing `this.contentEl()` gets used. If  `this.contentEl()` returns
   *        nothing it falls back to `document`.
   *
   * @return {NodeList}
   *         a list of dom elements that were found
   *
   * @see [Information on CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
   */
  $$(selector, context) {
    return Dom.$$(selector, context || this.contentEl());
  }

  /**
   * 检查组件的元素是否有CSS类名。
   *
   * @param {string} classToCheck
   *        CSS class name to check.
   *
   * @return {boolean}
   *         - True if the `Component` has the class.
   *         - False if the `Component` does not have the class`
   */
  hasClass(classToCheck) {
    return Dom.hasClass(this.el_, classToCheck);
  }

  /**
   *向“Component”元素添加CSS类名。
   *
   * @param {string} classToAdd
   *        CSS class name to add
   */
  addClass(classToAdd) {
    Dom.addClass(this.el_, classToAdd);
  }

  /**
   * 从“Component”元素中删除CSS类名。
   *
   * @param {string} classToRemove
   *        CSS class name to remove
   */
  removeClass(classToRemove) {
    Dom.removeClass(this.el_, classToRemove);
  }

  /**
   * 在组件的元素中添加或删除CSS类名。
   * - `classToToggle` gets added when {@link Component#hasClass} would return false.
   * - `classToToggle` gets removed when {@link Component#hasClass} would return true.
   *
   * @param  {string} classToToggle
   *         The class to add or remove based on (@link Component#hasClass}
   *
   * @param  {boolean|Dom~predicate} [predicate]
   *         An {@link Dom~predicate} function or a boolean
   */
  toggleClass(classToToggle, predicate) {
    Dom.toggleClass(this.el_, classToToggle, predicate);
  }

  /**
   * 如果“Component”元素被隐藏，则删除“vjs hidden”类名。
   * 
   */
  show() {
    this.removeClass('vjs-hidden');
  }

  /**
   * 将“vjs hidden”类名添加到“Component”元素中，以隐藏该元素。
   */
  hide() {
    this.addClass('vjs-hidden');
  }

  /**
   * 通过在“vjs”的类中显示“visible”元素，将其添加到`vjs'元素的锁中。在淡入/淡出时使用。
   *
   * @private
   */
  lockShowing() {
    this.addClass('vjs-lock-showing');
  }

  /**
   * 通过删除“vjs lock showing”类名，将“Component”的元素从其可见状态中解锁。在淡入/淡出时使用。
   * @private
   */
  unlockShowing() {
    this.removeClass('vjs-lock-showing');
  }

  /**
   * 获取“Component”元素的属性值。
   *
   * @param {string} attribute
   *        Name of the attribute to get the value from.
   *
   * @return {string|null}
   *         - The value of the attribute that was asked for.
   *         - Can be an empty string on some browsers if the attribute does not exist
   *           or has no value
   *         - Most browsers will return null if the attibute does not exist or has
   *           no value.
   *
   * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute}
   */
  getAttribute(attribute) {
    return Dom.getAttribute(this.el_, attribute);
  }

  /**
   * 设置“Component”元素的属性值
   *
   * @param {string} attribute
   *        Name of the attribute to set.
   *
   * @param {string} value
   *        Value to set the attribute to.
   *
   * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute}
   */
  setAttribute(attribute, value) {
    Dom.setAttribute(this.el_, attribute, value);
  }

  /**
   * 从“Component”元素中删除属性。
   *
   * @param {string} attribute
   *        Name of the attribute to remove.
   *
   * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttribute}
   */
  removeAttribute(attribute) {
    Dom.removeAttribute(this.el_, attribute);
  }

  /**
   * 根据CSS样式获取或设置组件的宽度。
   * See {@link Component#dimension} for more detailed information.
   *
   * @param {number|string} [num]
   *        The width that you want to set postfixed with '%', 'px' or nothing.
   *
   * @param {boolean} [skipListeners]
   *        Skip the componentresize event trigger
   *
   * @return {number|string}
   *         The width when getting, zero if there is no width. Can be a string
   *           postpixed with '%' or 'px'.
   */
  width(num, skipListeners) {
    return this.dimension('width', num, skipListeners);
  }

  /**
   * 根据CSS样式获取或设置组件的高度。
   * See {@link Component#dimension} for more detailed information.
   *
   * @param {number|string} [num]
   *        The height that you want to set postfixed with '%', 'px' or nothing.
   *
   * @param {boolean} [skipListeners]
   *        Skip the componentresize event trigger
   *
   * @return {number|string}
   *         The width when getting, zero if there is no width. Can be a string
   *         postpixed with '%' or 'px'.
   */
  height(num, skipListeners) {
    return this.dimension('height', num, skipListeners);
  }

  /**
   * 同时设置“Component”元素的宽度和高度。
   *
   * @param  {number|string} width
   *         Width to set the `Component`s element to.
   *
   * @param  {number|string} height
   *         Height to set the `Component`s element to.
   */
  dimensions(width, height) {
    // Skip componentresize listeners on width for optimization
    this.width(width, true);
    this.height(height);
  }

  /**
   * 获取或设置“Component”元素的宽度或高度。这是共享代码
   * for the {@link Component#width} and {@link Component#height}.
   *
   * Things to know:
   * - If the width or height in an number this will return the number postfixed with 'px'.
   * - If the width/height is a percent this will return the percent postfixed with '%'
   * - Hidden elements have a width of 0 with `window.getComputedStyle`. This function
   *   defaults to the `Component`s `style.width` and falls back to `window.getComputedStyle`.
   *   See [this]{@link http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/}
   *   for more information
   * - If you want the computed style of the component, use {@link Component#currentWidth}
   *   and {@link {Component#currentHeight}
   *
   * @fires Component#componentresize
   *
   * @param {string} widthOrHeight
   8        'width' or 'height'
   *
   * @param  {number|string} [num]
   8         New dimension
   *
   * @param  {boolean} [skipListeners]
   *         Skip componentresize event trigger
   *
   * @return {number}
   *         The dimension when getting or 0 if unset
   */
  dimension(widthOrHeight, num, skipListeners) {
    if (num !== undefined) {
      // 如果为null或字面上为NaN（NaN！==NaN）
      if (num === null || num !== num) {
        num = 0;
      }

      // 检查是否使用css宽度/高度（%或px）并调整
      if (('' + num).indexOf('%') !== -1 || ('' + num).indexOf('px') !== -1) {
        this.el_.style[widthOrHeight] = num;
      } else if (num === 'auto') {
        this.el_.style[widthOrHeight] = '';
      } else {
        this.el_.style[widthOrHeight] = num + 'px';
      }

      // skipListeners允许我们在设置宽度和高度时避免触发resize事件
      if (!skipListeners) {
        /**
         * Triggered when a component is resized.
         *
         * @event Component#componentresize
         * @type {EventTarget~Event}
         */
        this.trigger('componentresize');
      }

      return;
    }

    // 不设定值，所以要获取它
    // 确保元素存在
    if (!this.el_) {
      return 0;
    }

    // 从样式获取尺寸值
    const val = this.el_.style[widthOrHeight];
    const pxIndex = val.indexOf('px');

    if (pxIndex !== -1) {
      // 返回不带“px”的像素值
      return parseInt(val.slice(0, pxIndex), 10);
    }

    // 没有px所以使用%或没有设置样式，所以返回到offsetWidth/height
    // 如果组件有显示：无，偏移量将返回0
    // TODO:句柄显示：无和没有使用px的标注样式
    return parseInt(this.el_['offset' + toTitleCase(widthOrHeight)], 10);
  }

  /**
   * 获取组件元素的计算宽度或高度。
   *
   * Uses `window.getComputedStyle`.
   *
   * @param {string} widthOrHeight
   *        A string containing 'width' or 'height'. Whichever one you want to get.
   *
   * @return {number}
   *         The dimension that gets asked for or 0 if nothing was set
   *         for that dimension.
   */
  currentDimension(widthOrHeight) {
    let computedWidthOrHeight = 0;

    if (widthOrHeight !== 'width' && widthOrHeight !== 'height') {
      throw new Error('currentDimension only accepts width or height value');
    }

    computedWidthOrHeight = computedStyle(this.el_, widthOrHeight);

    // 从变量中删除“px”并将其解析为整数
    computedWidthOrHeight = parseFloat(computedWidthOrHeight);

    // 如果计算的值仍然为0，则可能是浏览器在说谎，我们需要检查偏移值。此代码也会在getComputedStyle不存在的地方运行。
    if (computedWidthOrHeight === 0 || isNaN(computedWidthOrHeight)) {
      const rule = `offset${toTitleCase(widthOrHeight)}`;

      computedWidthOrHeight = this.el_[rule];
    }

    return computedWidthOrHeight;
  }

  /**
   * 包含“Component”的宽度和高度值的对象
   * 计算风格。用途`window.getComputedStyle`.
   *
   * @typedef {Object} Component~DimensionObject
   *
   * @property {number} width
   *           The width of the `Component`s computed style.
   *
   * @property {number} height
   *           The height of the `Component`s computed style.
   */

  /**
   * 获取一个包含组件元素的计算宽度和高度值的对象。
   *
   * Uses `window.getComputedStyle`.
   *
   * @return {Component~DimensionObject}
   *         The computed dimensions of the component's element.
   */
  currentDimensions() {
    return {
      width: this.currentDimension('width'),
      height: this.currentDimension('height')
    };
  }

  /**
   * 获取组件元素的计算宽度。
   *
   * Uses `window.getComputedStyle`.
   *
   * @return {number}
   *         The computed width of the component's element.
   */
  currentWidth() {
    return this.currentDimension('width');
  }

  /**
   * 获取组件元素的计算高度。
   *
   * Uses `window.getComputedStyle`.
   *
   * @return {number}
   *         The computed height of the component's element.
   */
  currentHeight() {
    return this.currentDimension('height');
  }

  /**
   * 设置此组件的焦点
   */
  focus() {
    this.el_.focus();
  }

  /**
   * 从该组件中移除焦点
   */
  blur() {
    this.el_.blur();
  }

  /**
   * 当此组件接收到不处理的“keydown”事件时，
   * 它将事件传递给玩家处理。
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   */
  handleKeyDown(event) {
    if (this.player_) {

      // 我们只在这里停止传播，因为我们希望未处理的事件返回到浏览器。
      event.stopPropagation();
      this.player_.handleKeyDown(event);
    }
  }

  /**
   * Many components used to have a `handleKeyPress` method, which was poorly
   * named because it listened to a `keydown` event. This method name now
   * delegates to `handleKeyDown`. This means anyone calling `handleKeyPress`
   * will not see their method calls stop working.
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to be called.
   */
  handleKeyPress(event) {
    this.handleKeyDown(event);
  }

  /**
   * Emit a 'tap' events when touch event support gets detected. This gets used to
   * support toggling the controls through a tap on the video. They get enabled
   * because every sub-component would have extra overhead otherwise.
   *
   * @private
   * @fires Component#tap
   * @listens Component#touchstart
   * @listens Component#touchmove
   * @listens Component#touchleave
   * @listens Component#touchcancel
   * @listens Component#touchend

   */
  emitTapEvents() {
    // 跟踪开始时间，这样我们就可以确定触摸持续了多长时间
    let touchStart = 0;
    let firstTouch = null;

    // 在触摸事件中允许的最大移动量仍然被认为是一个点击。其他流行的lib使用的范围是2(锤子.js)到15，
    // 所以10看起来是个不错的整数。
    const tapMovementThreshold = 10;

    // 触碰的最大长度，同时仍被视为轻触
    const touchTimeThreshold = 200;

    let couldBeTap;

    this.on('touchstart', function(event) {
      // 如果不止一个手指，不要认为这是一个点击
      if (event.touches.length === 1) {
        // 从对象复制pageX/pageY
        firstTouch = {
          pageX: event.touches[0].pageX,
          pageY: event.touches[0].pageY
        };
        // 记录开始时间，这样我们就可以检测到轻触与“触摸并保持”
        touchStart = window.performance.now();
        // 重置couldBeTap跟踪
        couldBeTap = true;
      }
    });

    this.on('touchmove', function(event) {
      // 如果不止一个手指，不要认为这是一个点击
      if (event.touches.length > 1) {
        couldBeTap = false;
      } else if (firstTouch) {
        // 一些设备会抛出所有的触碰动作，只有一点点的触碰。
        // 所以，如果我们只移动一小段距离，这仍然是一个水龙头
        const xdiff = event.touches[0].pageX - firstTouch.pageX;
        const ydiff = event.touches[0].pageY - firstTouch.pageY;
        const touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);

        if (touchDistance > tapMovementThreshold) {
          couldBeTap = false;
        }
      }
    });

    const noTap = function() {
      couldBeTap = false;
    };

    // TODO: Listen to the original target. http://youtu.be/DujfpXOKUp8?t=13m8s
    this.on('touchleave', noTap);
    this.on('touchcancel', noTap);

    // 当触摸结束时，测量所用时间并触发相应的
    // event
    this.on('touchend', function(event) {
      firstTouch = null;
      // 仅当触碰未发生/未进行移动时
      if (couldBeTap === true) {
        // 测量触摸持续了多长时间
        const touchTime = window.performance.now() - touchStart;

        // 确保触摸低于被视为轻触的阈值
        if (touchTime < touchTimeThreshold) {
          // 别让浏览器把它变成点击
          event.preventDefault();
          /**
           * 点击“组件”时触发.
           *
           * @event Component#tap
           * @type {EventTarget~Event}
           */
          this.trigger('tap');
          // 如果其他事件属性不在之后，
          // 复制touchend事件对象并将类型更改为tap可能是很好的事件.
          // fixEvent运行（例如。事件.目标)
        }
      }
    });
  }

  /**
   * This function reports user activity whenever touch events happen. This can get
   * turned off by any sub-components that wants touch events to act another way.
   *
   * Report user touch activity when touch events occur. User activity gets used to
   * determine when controls should show/hide. It is simple when it comes to mouse
   * events, because any mouse event should show the controls. So we capture mouse
   * events that bubble up to the player and report activity when that happens.
   * With touch events it isn't as easy as `touchstart` and `touchend` toggle player
   * controls. So touch events can't help us at the player level either.
   *
   * User activity gets checked asynchronously. So what could happen is a tap event
   * on the video turns the controls off. Then the `touchend` event bubbles up to
   * the player. Which, if it reported user activity, would turn the controls right
   * back on. We also don't want to completely block touch events from bubbling up.
   * Furthermore a `touchmove` event and anything other than a tap, should not turn
   * controls back on.
   *
   * @listens Component#touchstart
   * @listens Component#touchmove
   * @listens Component#touchend
   * @listens Component#touchcancel
   */
  enableTouchActivity() {
    // 如果根播放器不支持报告用户活动，则不要继续
    if (!this.player() || !this.player().reportUserActivity) {
      return;
    }

    // 用于报告用户处于活动状态的侦听器
    const report = Fn.bind(this.player(), this.player().reportUserActivity);

    let touchHolding;

    this.on('touchstart', function() {
      report();
      // 只要他们触摸设备或按下鼠标，
      // 我们认为它们是活跃的，即使它们不动手指或鼠标。
      // 所以我们想继续更新他们是活跃的
      this.clearInterval(touchHolding);
      // 以与activityCheck相同的时间间隔报告
      touchHolding = this.setInterval(report, 250);
    });

    const touchEnd = function(event) {
      report();
      // 如果触摸保持不变，停止保持活动的间隔
      this.clearInterval(touchHolding);
    };

    this.on('touchmove', report);
    this.on('touchend', touchEnd);
    this.on('touchcancel', touchEnd);
  }

  /**
   * 一个没有参数并绑定到“Component”上下文中的回调。
   * @callback Component~GenericCallback
   * @this Component
   */

  /**
   *  创建在“x”毫秒超时后运行的函数。这个函数是一个包装器`窗口.setTimeout`.
   *  不过，有几个理由可以用这个来代替
   * 1. It gets cleared via  {@link Component#clearTimeout} when
   *    {@link Component#dispose} gets called.
   * 2. The function callback will gets turned into a {@link Component~GenericCallback}
   *
   * > Note: You can't use `window.clearTimeout` on the id returned by this function. This
   *         will cause its dispose listener not to get cleaned up! Please use
   *         {@link Component#clearTimeout} or {@link Component#dispose} instead.
   *
   * @param {Component~GenericCallback} fn
   *        The function that will be run after `timeout`.
   *
   * @param {number} timeout
   *        Timeout in milliseconds to delay before executing the specified function.
   *
   * @return {number}
   *         Returns a timeout ID that gets used to identify the timeout. It can also
   *         get used in {@link Component#clearTimeout} to clear the timeout that
   *         was set.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout}
   */
  setTimeout(fn, timeout) {
    // 声明为变量，以便它们在超时函数中正确可用
    // eslint-disable-next-line
    var timeoutId, disposeFn;

    fn = Fn.bind(this, fn);

    this.clearTimersOnDispose_();

    timeoutId = window.setTimeout(() => {
      if (this.setTimeoutIds_.has(timeoutId)) {
        this.setTimeoutIds_.delete(timeoutId);
      }
      fn();
    }, timeout);

    this.setTimeoutIds_.add(timeoutId);

    return timeoutId;
  }

  /**
   * 清除通过创建的超时`窗口.setTimeout`
   * {@link Component#setTimeout}. If you set a timeout via {@link Component#setTimeout}
   * use this function instead of `window.clearTimout`. If you don't your dispose
   * listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} timeoutId
   *        The id of the timeout to clear. The return value of
   *        {@link Component#setTimeout} or `window.setTimeout`.
   *
   * @return {number}
   *         Returns the timeout id that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearTimeout}
   */
  clearTimeout(timeoutId) {
    if (this.setTimeoutIds_.has(timeoutId)) {
      this.setTimeoutIds_.delete(timeoutId);
      window.clearTimeout(timeoutId);
    }

    return timeoutId;
  }

  /**
   * 创建每隔“x”毫秒运行一次的函数。这个函数是一个包装器`窗口.setInterval`. 
   * 尽管有几个理由可以用这个来代替。
   * 1. It gets cleared via  {@link Component#clearInterval} when
   *    {@link Component#dispose} gets called.
   * 2. The function callback will be a {@link Component~GenericCallback}
   *
   * @param {Component~GenericCallback} fn
   *        The function to run every `x` seconds.
   *
   * @param {number} interval
   *        Execute the specified function every `x` milliseconds.
   *
   * @return {number}
   *         Returns an id that can be used to identify the interval. It can also be be used in
   *         {@link Component#clearInterval} to clear the interval.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval}
   */
  setInterval(fn, interval) {
    fn = Fn.bind(this, fn);

    this.clearTimersOnDispose_();

    const intervalId = window.setInterval(fn, interval);

    this.setIntervalIds_.add(intervalId);

    return intervalId;
  }

  /**
   * 清除通过创建的间隔`窗口.setInterval`
   * {@link Component#setInterval}. If you set an inteval via {@link Component#setInterval}
   * use this function instead of `window.clearInterval`. If you don't your dispose
   * listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} intervalId
   *        The id of the interval to clear. The return value of
   *        {@link Component#setInterval} or `window.setInterval`.
   *
   * @return {number}
   *         Returns the interval id that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearInterval}
   */
  clearInterval(intervalId) {
    if (this.setIntervalIds_.has(intervalId)) {
      this.setIntervalIds_.delete(intervalId);
      window.clearInterval(intervalId);
    }

    return intervalId;
  }

  /**
   * 将回调排队传递到requestAnimationFrame（rAF），但有一些额外的奖励：
   *
   * - Supports browsers that do not support rAF by falling back to
   *   {@link Component#setTimeout}.
   *
   * - The callback is turned into a {@link Component~GenericCallback} (i.e.
   *   bound to the component).
   *
   * - Automatic cancellation of the rAF callback is handled if the component
   *   is disposed before it is called.
   *
   * @param  {Component~GenericCallback} fn
   *         A function that will be bound to this component and executed just
   *         before the browser's next repaint.
   *
   * @return {number}
   *         Returns an rAF ID that gets used to identify the timeout. It can
   *         also be used in {@link Component#cancelAnimationFrame} to cancel
   *         the animation frame callback.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame}
   */
  requestAnimationFrame(fn) {
    // 回到使用计时器。
    if (!this.supportsRaf_) {
      return this.setTimeout(fn, 1000 / 60);
    }

    this.clearTimersOnDispose_();

    // 声明为变量，以便它们在rAF函数中正确可用
    // eslint-disable-next-line
    var id;
    fn = Fn.bind(this, fn);

    id = window.requestAnimationFrame(() => {
      if (this.rafIds_.has(id)) {
        this.rafIds_.delete(id);
      }
      fn();
    });
    this.rafIds_.add(id);

    return id;
  }

  /**
   * 请求一个动画帧，但只请求一个名为animation的帧帧将排队。不会添加另一个，直到上一个结束了。
   *
   * @param {string} name
   *        The name to give this requestAnimationFrame
   *
   * @param  {Component~GenericCallback} fn
   *         A function that will be bound to this component and executed just
   *         before the browser's next repaint.
   *
   *  @return {undefined|String}
   *        get return
   */
  requestNamedAnimationFrame(name, fn) {
    if (this.namedRafs_.has(name)) {
      return;
    }
    this.clearTimersOnDispose_();

    fn = Fn.bind(this, fn);

    const id = this.requestAnimationFrame(() => {
      fn();
      if (this.namedRafs_.has(name)) {
        this.namedRafs_.delete(name);
      }
    });

    this.namedRafs_.set(name, id);

    return name;
  }

  /**
   * 取消当前已命名动画帧（如果存在）。
   *
   * @param {string} name
   *        The name of the requestAnimationFrame to cancel.
   */
  cancelNamedAnimationFrame(name) {
    if (!this.namedRafs_.has(name)) {
      return;
    }

    this.cancelAnimationFrame(this.namedRafs_.get(name));
    this.namedRafs_.delete(name);
  }

  /**
   * 取消传递给 {@link Component#requestAnimationFrame}的排队回调
   * (rAF).
   *
   * If you queue an rAF callback via {@link Component#requestAnimationFrame},
   * use this function instead of `window.cancelAnimationFrame`. If you don't,
   * your dispose listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} id
   *        The rAF ID to clear. The return value of {@link Component#requestAnimationFrame}.
   *
   * @return {number}
   *         Returns the rAF ID that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame}
   */
  cancelAnimationFrame(id) {
    // Fall back to using a timer.
    if (!this.supportsRaf_) {
      return this.clearTimeout(id);
    }

    if (this.rafIds_.has(id)) {
      this.rafIds_.delete(id);
      window.cancelAnimationFrame(id);
    }

    return id;

  }

  /**
   * 设置“requestAnimationFrame”、“setTimeout”的函数，和“setInterval”，在释放时清除。
   *
   * > Previously each timer added and removed dispose listeners on it's own.
   * For better performance it was decided to batch them all, and use `Set`s
   * to track outstanding timer ids.
   *
   * @private
   */
  clearTimersOnDispose_() {
    if (this.clearingTimersOnDispose_) {
      return;
    }

    this.clearingTimersOnDispose_ = true;
    this.one('dispose', () => {
      [
        ['namedRafs_', 'cancelNamedAnimationFrame'],
        ['rafIds_', 'cancelAnimationFrame'],
        ['setTimeoutIds_', 'clearTimeout'],
        ['setIntervalIds_', 'clearInterval']
      ].forEach(([idName, cancelName]) => {
        // for a `Set` key will actually be the value again
        // so forEach((val, val) =>` but for maps we want to use
        // the key.
        this[idName].forEach((val, key) => this[cancelName](key));
      });

      this.clearingTimersOnDispose_ = false;
    });
  }

  /**
   * 使用给定名称和组件的“videojs”注册“Component”。
   *
   * > NOTE: {@link Tech}s should not be registered as a `Component`. {@link Tech}s
   *         should be registered using {@link Tech.registerTech} or
   *         {@link videojs:videojs.registerTech}.
   *
   * > NOTE: This function can also be seen on videojs as
   *         {@link videojs:videojs.registerComponent}.
   *
   * @param {string} name
   *        The name of the `Component` to register.
   *
   * @param {Component} ComponentToRegister
   *        The `Component` class to register.
   *
   * @return {Component}
   *         The `Component` that was registered.
   */
  static registerComponent(name, ComponentToRegister) {
    console.log(name);
    if (typeof name !== 'string' || !name) {
      throw new Error(`Illegal component name, "${name}"; must be a non-empty string.`);
    }

    const Tech = Component.getComponent('Tech');

    // 我们需要确保只有在技术已经注册的情况下才进行检查。
    const isTech = Tech && Tech.isTech(ComponentToRegister);
    const isComp = Component === ComponentToRegister ||
      Component.prototype.isPrototypeOf(ComponentToRegister.prototype);

    if (isTech || !isComp) {
      let reason;

      if (isTech) {
        reason = 'techs must be registered using Tech.registerTech()';
      } else {
        reason = 'must be a Component subclass';
      }

      throw new Error(`Illegal component, "${name}"; ${reason}.`);
    }

    name = toTitleCase(name);

    if (!Component.components_) {
      Component.components_ = {};
    }

    const Player = Component.getComponent('Player');

    if (name === 'Player' && Player && Player.players) {
      const players = Player.players;
      const playerNames = Object.keys(players);

      // 如果我们有球员被淘汰，那么他们的名字仍然在player中。 所以，我们必须循环并验证for each item不为空。
      // 这允许注册播放器组件在所有玩家被释放后或者在任何玩家被创建之前。
      if (players &&
          playerNames.length > 0 &&
          playerNames.map((pname) => players[pname]).every(Boolean)) {
        throw new Error('Can not register Player component after player has been created.');
      }
    }

    Component.components_[name] = ComponentToRegister;
    Component.components_[toLowerCase(name)] = ComponentToRegister;

    return ComponentToRegister;
  }

  /**
   * 根据注册的名称获取“Component”。
   *
   * @param {string} name
   *        The Name of the component to get.
   *
   * @return {Component}
   *         The `Component` that got registered under the given name.
   *
   * @deprecated In `videojs` 6 this will not return `Component`s that were not
   *             registered using {@link Component.registerComponent}. Currently we
   *             check the global `videojs` object for a `Component` name and
   *             return that if it exists.
   */
  static getComponent(name) {
    // console.log(Component.components_);
    if (!name || !Component.components_) {
      return;
    }

    return Component.components_[name];
  }
}

/**
 * 此组件是否支持“requestAnimationFrame”。
 *
 * 这主要是为了测试目的而公开的。
 *
 * @private
 * @type {Boolean}
 */
Component.prototype.supportsRaf_ = typeof window.requestAnimationFrame === 'function' &&
  typeof window.cancelAnimationFrame === 'function';

Component.registerComponent('Component', Component);

export default Component;
