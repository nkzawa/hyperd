
module.exports = Widget;

function Widget(Component, properties) {
  this.Component = Component;
  this.properties = properties;
  this.component = null;
  this.rendered = false;
}

Widget.prototype.type = 'Widget';

Widget.prototype.init = function() {
  this.component = new this.Component(this.properties);
  this.rendered = this.component.doRender();
  return this.component.node;
};

Widget.prototype.update = function(previous, domNode) {
  this.component = previous.component;
  this.component.setProps(this.properties);
  this.rendered = this.component.doRender();
};

Widget.prototype.destroy = function(domNode) {
  this.component.destroy();
};
