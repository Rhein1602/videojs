/**
 * @file extend.js
 * @module extend
 */

import _inherits from '@babel/runtime/helpers/inherits';

/**
 * Used to subclass an existing class by emulating ES subclassing using the
 * `extends` keyword.
 * 用于通过使用“extends”关键字模拟ES子类化来子类化现有类。
 * @function
 * @example
 * var MyComponent = videojs.extend(videojs.getComponent('Component'), {
 *   myCustomMethod: function() {
 *     // Do things in my method.
 *   }
 * });
 *
 * @param    {Function} superClass
 *           The class to inherit from
 *
 * @param    {Object}   [subClassMethods={}]
 *           Methods of the new class
 *
 * @return   {Function}
 *           The new class with subClassMethods that inherited superClass.
 */
const extend = function(superClass, subClassMethods = {}) {
  let subClass = function() {
    superClass.apply(this, arguments);
  };

  let methods = {};

  if (typeof subClassMethods === 'object') {
    if (subClassMethods.constructor !== Object.prototype.constructor) {
      subClass = subClassMethods.constructor;
    }
    methods = subClassMethods;
  } else if (typeof subClassMethods === 'function') {
    subClass = subClassMethods;
  }

  _inherits(subClass, superClass);

  // this is needed for backward-compatibility and node compatibility.
  // 这是向后兼容性和节点兼容性所必需的。
  if (superClass) {
    subClass.super_ = superClass;
  }

  // Extend subObj's prototype with functions and other properties from props
  // 用props中的函数和其他属性扩展subObj的原型
  for (const name in methods) {
    if (methods.hasOwnProperty(name)) {
      subClass.prototype[name] = methods[name];
    }
  }

  return subClass;
};

export default extend;
