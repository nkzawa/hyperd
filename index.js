var Component = require('./lib/component');

exports = module.exports = hyperd;

exports.Component = Component;

function hyperd(node, render) {
  var component = new Component();
  component.render = render;
  return component.attachTo(node);
}
