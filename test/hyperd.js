var expect = require('expect.js');
var hyperd = require('../');

describe('hyperd', function() {
  beforeEach(function() {
    this.node = document.createElement('div');
    document.body.appendChild(this.node);
  });

  afterEach(function() {
    document.body.removeChild(this.node);
  });

  it('should expose classes', function() {
    expect(hyperd.Component).to.be.a(Function);
  });

  it('should create a component', function(done) {
    var component = hyperd(this.node, function() {
      return '<div>woot</div>';
    });
    component.on('render', function() {
      expect(this.node.innerHTML).to.be('woot');
      component.destroy();
      done();
    });

    expect(component).to.be.a(hyperd.Component);
    expect(component.node).to.be(this.node);
  });
});
