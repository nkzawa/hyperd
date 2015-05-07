Hyperd
======

[![Build Status](https://travis-ci.org/nkzawa/hyperd.svg)](https://travis-ci.org/nkzawa/hyperd)

Virtual DOM based, template engine agnostic view library.

```js
var view = hyperd(document.getElementById('count'), function() {
  return '<div id="count">Counter: ' + this.data.count + '</div>';
});

view.data.count = 0;

setInterval(function() {
  view.data.count++;
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

## Licence

MIT
