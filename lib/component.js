var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var virtualDOM = require('virtual-dom');
var virtualHTML = require('virtual-html');
var delegate = require('dom-delegate');
var raf = require('raf');
var clone = require('clone');
var equal = require('deep-equal');
var extend = require('xtend/mutable');
var trim = require('trim');
var Widget = require('./Widget');

var events = [
  'render',
  'destroy'
];

module.exports = Component;

inherits(Component, EventEmitter);

Component.extend = function(proto) {
  var Parent = this;

  var Child;
  if (proto.hasOwnProperty('constructor')) {
    Child = proto.constructor;
  } else {
    Child = function() {
      return Parent.apply(this, arguments);
    };
  }

  inherits(Child, Parent);

  extend(Child, Parent);
  extend(Child.prototype, proto);

  return Child;
};

function Component(props) {
  EventEmitter.call(this);

  this.data = {};
  this.oldData = null;
  this.node = null;
  this.tree = null;
  this.requestId = null;
  this.isDirty = false;
  this.delegate = delegate();
  this.setProps(props);
}

/**
 * @api public
 */

Component.prototype.attachTo = function(node) {
  this.node = node;
  this.tree = virtualHTML(node.outerHTML);
  this.delegate.root(node);
  this.runLoop();
  return this;
};

/**
 * @api public
 */

Component.prototype.destroy = function() {
  raf.cancel(this.requestId);

  this.props = null;
  this.data = null;
  this.oldData = null;
  this.node = null;
  this.context = null;
  this.tree = null;
  this.requestId = null;
  this.isDirty = false;

  this.onDestroy && this.onDestroy();
  this.emit('destroy');

  this.removeAllListeners();

  this.delegate.destroy();
  this.delegate = null;
};

Component.prototype.setProps = function(props) {
  props = props || {};
  this.isDirty = !equal(this.props, props, { strict: true });
  this.props = props;
};

/**
 * @api public
 * @override
 */

Component.prototype.on = function(type, selector, listener) {
  if ('function' === typeof selector) {
    listener = selector;
    selector = null;
  }

  if (!selector && ~events.indexOf(type)) {
    EventEmitter.prototype.on.call(this, type, listener);
    return this;
  }

  var l = listener.bind(this);
  listener.bound = l;
  this.delegate.on(type, selector, l);
  return this;
};

/**
 * @api public
 * @override
 */

Component.prototype.removeListener = function(type, selector, listener) {
  if ('function' === typeof selector) {
    listener = selector;
    selector = null;
  }

  if (!selector && ~events.indexOf(type)) {
    EventEmitter.prototype.removeListener.call(this, type, listener);
    return this;
  }

  this.delegate.off(type, selector, listener.bound || listener);
  return this;
};

/**
 * @api public
 * @override
 */

Component.prototype.removeAllListeners = function(type, selector) {
  if (!selector) {
    EventEmitter.prototype.removeAllListeners.call(this, type);
  }

  this.delegate.off(type, selector);
  return this;
};

/**
 * @api private
 */

Component.prototype.runLoop = function() {
  var self = this;
  this.requestId = raf(function tick() {
    self.tick();
    raf(tick);
  });
};

/**
 * @api private
 */

Component.prototype.tick = function() {
  if (!this.isDirty) {
    this.isDirty = !equal(this.data, this.oldData, { strict: true });
    if (!this.isDirty) return;
  }

  var html = this.render();
  var tree = this.createTree(html);

  this.applyTree(tree);

  this.oldData = clone(this.data);
  this.tree = tree;
  this.isDirty = false;
  this.onRender && this.onRender();
  this.emit('render');
};

/**
 * @api private
 */

Component.prototype.inflate = function(tree) {
  for (var tagName in this.components) {
    if (!this.components.hasOwnProperty(tagName)) continue;
    if (tagName.toUpperCase() !== tree.tagName) continue;
    return new Widget(this.components[tagName], tree.properties);
  }

  tree.children = tree.children.map(function(t) {
    return this.inflate(t);
  }, this);

  return tree;
};

/**
 * @api private
 */

Component.prototype.createTree = function(html) {
  var tree = virtualHTML(trim(html));
  if (this.components) {
    tree = this.inflate(tree);
  }
  return tree;
};

/**
 * @api private
 */

Component.prototype.applyTree = function(tree) {
  if (this.node) {
    var patches = virtualDOM.diff(this.tree, tree);
    virtualDOM.patch(this.node, patches);
  } else {
    this.node = virtualDOM.create(tree);
    this.delegate.root(this.node);
  }
};
