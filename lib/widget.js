
module.exports = Widget;

function Widget(Component, properties) {
  this.Component = Component;
  this.properties = properties;
  this.component = null;
}

Widget.prototype.type = 'Widget';

Widget.prototype.init = function() {
  this.component = new this.Component(this.properties);
  this.component.tick();
  return this.component.node;
};

Widget.prototype.update = function(previous, domNode) {
  this.component = previous.component;
  this.component.setProps(this.properties);
  this.component.tick();
};

Widget.prototype.destroy = function(domNode) {
  this.component.destroy();
};
