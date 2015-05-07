var EventEmitter = require('events').EventEmitter;
var util = require('util');
var virtualDOM = require('virtual-dom');
var htmlToVdom = require('html-to-vdom');
var delegate = require('dom-delegate');
var raf = require('raf');
var clone = require('clone');
var equal = require('deep-equal');
var extend = require('xtend/mutable');
var trim = require('trim');
var Widget = require('./widget');
var slice = Array.prototype.slice;
var emit = EventEmitter.prototype.emit;
var on = EventEmitter.prototype.on;

var convertHTML = htmlToVdom({
  VNode: virtualDOM.VNode,
  VText: virtualDOM.VText
});

var events = [
  'attach',
  'render',
  'destroy'
];

module.exports = Component;

util.inherits(Component, EventEmitter);

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

  util.inherits(Child, Parent);

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
  this.components = this.components || {};
  this.widgets = [];
  this.delegate = delegate();
  this.setProps(props);
}

/**
 * @api public
 */

Component.prototype.attachTo = function(node) {
  this.node = node;
  this.tree = convertHTML({ getVNodeKey: getVNodeKey }, node.outerHTML);
  this.delegate.root(node);
  this.emitAttach();
  this.runLoop();
  return this;
};

/**
 * @api public
 */

Component.prototype.destroy = function() {
  raf.cancel(this.requestId);

  // destroy child components
  var widgets = this.widgets;
  for (var i = 0, len = widgets.length; i < len; i++) {
    var component = widgets[i].component;
    component && component.destroy();
  }

  this.props = null;
  this.data = null;
  this.oldData = null;
  this.node = null;
  this.context = null;
  this.tree = null;
  this.requestId = null;
  this.isDirty = false;
  this.widgets = null;

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

Component.prototype.emit = function(type) {
  if (~events.indexOf(type)) {
    emit.apply(this, arguments);
    return this;
  }

  var detail = slice.call(arguments, 1);
  var event;
  if (global.CustomEvent) {
    event = new CustomEvent(type, { bubbles: true, detail: detail });
  } else {
    event = document.createEvent('CustomEvent');
    event.initCustomEvent(type, true, false, detail);
  }
  this.node.dispatchEvent(event);
  return this;
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
    on.call(this, type, listener);
    return this;
  }

  var self = this;

  function g(e) {
    var args = [e];
    if (util.isArray(e.detail)) {
      args = args.concat(e.detail);
    }
    listener.apply(self, args);
  }

  listener.listener = g;
  this.delegate.on(type, selector, g);
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

  this.delegate.off(type, selector, listener.listener || listener);
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
    if (!self.node) return;
    self.requestId = raf(tick);
  });
};

/**
 * @api private
 */

Component.prototype.tick = function() {
  if (this.doRender()) {
    this.emitRender();
  }
};

/**
 * @api private
 */

Component.prototype.tickChildren = function() {
  var widgets = this.widgets;
  for (var i = 0, len = widgets.length; i < len; i++) {
    var widget = widgets[i];
    widget.component && widget.component.tick();
  }
};

/**
 * @api private
 */

Component.prototype.doRender = function() {
  if (!this.isDirty) {
    this.isDirty = !equal(this.data, this.oldData, { strict: true });
    if (!this.isDirty) {
      this.tickChildren();
      return false;
    }
  }

  var html = this.render();
  var tree = this.createTree(html);

  this.applyTree(tree);

  this.oldData = clone(this.data);
  this.tree = tree;
  this.isDirty = false;

  return true;
};

/**
 * @api private
 */

Component.prototype.inflate = function(tree) {
  if (!tree.tagName) return tree;

  var components = this.components;
  var tagName = tree.tagName.toLowerCase();
  for (var _tagName in components) {
    if (!components.hasOwnProperty(_tagName)) continue;
    if (_tagName.toLowerCase() !== tagName) continue;
    var widget = new Widget(components[_tagName], tree.properties);
    this.widgets.push(widget);
    return widget;
  }

  var children = tree.children || [];
  for (var i = 0, len = children.length; i < len; i++) {
    children[i] = this.inflate(children[i]);
  }
  return tree;
};

/**
 * @api private
 */

Component.prototype.createTree = function(html) {
  var tree = convertHTML({ getVNodeKey: getVNodeKey }, trim(html));
  if (this.components) {
    this.widgets = [];
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
    this.emitAttach();
  }
};

/**
 * @api private
 */

Component.prototype.emitAttach = function() {
  this.onAttach && this.onAttach();
  this.emit('attach');
};

/**
 * @api private
 */

Component.prototype.emitRender = function() {
  var widgets = this.widgets;
  for (var i = 0, len = widgets.length; i < len; i++) {
    var widget = widgets[i];
    if (widget.rendered) {
      widget.component.emitRender();
    }
  }

  this.onRender && this.onRender();
  this.emit('render');
};

function getVNodeKey(properties) {
  if (properties.dataset) {
    return properties.dataset.hkey;
  }
}
