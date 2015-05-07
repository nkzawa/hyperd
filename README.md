Hyperd
======

[![Build Status](https://travis-ci.org/nkzawa/hyperd.svg)](https://travis-ci.org/nkzawa/hyperd)

Virtual DOM based, template engine agnostic, a lightweight view library.

```js
var component = hyperd(document.getElementById('count'), function() {
  return '<div id="count">Counter: ' + this.data.count + '</div>';
});

component.data.count = 0;

setInterval(function() {
  component.data.count++;
}, 1000);
```

## Installation

    $ npm install hyperd

```html
<script src="node_modules/hyperd/hyperd.js"></script>
```

#### With Bower

    $ bower install hyperd

## Features

- Virtual DOM diffing
- Template engine agnostic
- Auto-redrawing
- Building reusable components
- Small API

## Examples

- [Counter](http://nkzawa.github.io/hyperd/examples/counter)
- [Counter Component](http://nkzawa.github.io/hyperd/examples/counter-component)
- [TodoMVC](http://nkzawa.github.io/hyperd-todomvc/) ([source](https://github.com/nkzawa/hyperd-todomvc))

## API Documentation

#### hyperd(node, render)

- `node` HTMLElement Node to attach
- `render` Function Called upon redrawing, should return a html string.
- Return: hyperd.Component

A short circuit to create a simple component instance.

### Class: hyperd.Component

The base component class.

#### Class Method: hyperd.Component.extend(proto);

- `proto` Object protoype object
- Return: Function A new component constructor

Creates a new component class.

```js
var MyComponent = hyperd.Component.extend({
  render: function() {
    return '<div>hi</div>';
  }
});
```

#### new hyperd.Component([props])

- `props` Object properties

In classes that extends `hyperd.Component`, make sure to call the super constructor so that the all settings can be initialized.

```js
hyperd.Component.extend({
  constructor: function(props) {
    hyperd.Component.apply(this, arguments);
    ...
  }
});
```

#### component.props

The properties of the component.

```js
var component = new MyComponent({ foo: "hi" });
console.log(component.props.foo); // "hi"
```

#### component.data

The state data of the component. Mutating `data` triggers UI updates.

#### component.node

The node element which the component is attached to.

#### component.components

Definitions of child components. You can use defined components like a custom element on `render()`.

```js
var Child = hyperd.Component.extend({
  render: function() {
    return '<div>' + this.props.foo + '</div>';
  }
});

hyperd.Component.extend({
  components: { child: Child },
  render: function() {
    return  '<div><child foo="hi"></div>'
  }
});
```

#### component.attachTo(node)

- `node` HTMLElement
- Return: `this`

Attaches the component to a DOM node.

#### component.render()

- Return: String A html string to render.

Note: **implement this function, but do NOT call it directly**.

Reuired to implement. This method is called automatically and asynchronously when you update `component.data`.

#### component.destroy()

Teardown and delete all properties and event bindings including descendant components.

#### component.emit(event\[, args1\]\[, args2\]\[, ...\])

- `event` String The event type to be triggered.
- Return: `this`

Trigger a DOM event for `component.node` with the supplied arguments.

```js
component.emit('edit', arg);
```

#### component.on(event, listener)

- `event` String The event type.
- `listener` Function
- Return: `this`

Add a listener for the specified event.

```js
component.on('render', function() { ... });
```

#### component.on(event, selector, listener)

- `event` String The event type.
- `selector` String CSS selector.
- `listener` Function The listener always take an event object as the first argument.
- Return: `this`

Add a listener for the delegated event. The listener is called only for descendants that match the `selector`. You can use this to listen an event of a child component too.

```js
hyperd.Component.extend({
  constructor: function() {
    hyperd.Component.apply(this, arguments);
    this.on('click', 'button', function(event) {
      console.log('clicked!');
    });
  }
  render: function() {
    return  '<div><button type="button">Click me!</button></div>'
  }
});
```

#### component.removeListener(event, listener)

Remove a listener for the specified event.

#### component.removeListener(event, selector, listener)

Remove a listener for the delegated event.

#### component.removeAllListeners(\[event\]\[, selector\])

Remove all listeners, or those of the specified event or the delegated event.

#### component.onAttach()

Called upon after the component is attached to a node.

#### component.onRender()

Called upon after the component is rerendered.

#### component.onDestroy()

Called upon after the component is destroyed.

#### Event: 'attach'

The same as `component.onAttach`.

```js
component.on('attach', function() { ... });
```

#### Event: 'render'

The same as `component.onRender`.

#### Event: 'destroy'

The same as `component.onDestroy`.

#### Attribute: 'data-hkey'

The identifier used to differentiate a node. Used to reconcile an element will be reordered or destroyed.

```js
hyperd.Component.extend({
  render: function() {
    var items = ['foo', 'bar', 'baz'];
    return '<ul>' + items.map(function(item) {
      return '<li data-hkey="' + item + '">' + item + '</li>';
    }) + '</ul>';
  }
});
```

## Licence

MIT
