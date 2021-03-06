JS-RecursiveEvents
==================

Instantiable class based on [Dustin Diaz'](http://dustindiaz.com/)
[klass](http://www.dustindiaz.com/klass/) module, which provides
recursive-event-bindings.  
See the [klass library on GitHub](https://github.com/ded/klass) as well.

The goal of this was to create a simply library or script that allowed for
event listeners to be bound to a variable string (eg. click, hover, submit,
collapse), but be called recursively.

That is to say, each call to add an event listener or bind one would pass along
a callback function of the subsequent listener in the stack, controlling the
order in which their called.

Note: ought to work with [John Resig's](http://ejohn.org/)
[Simple javascript inheritance](http://ejohn.org/blog/simple-javascript-inheritance/)
class. Simply change the first line of `RecursiveEvents.class.js` from
`var RecursiveEvents = klass({` to `var RecursiveEvents = Class.extend({`.

### Usage

``` javascript
// instantiate
var sample = (new RecursiveEvents());

// click event bindings
sample.attach('click', function(callback) {
    console.log('round 1: apples');
    callback();
});
sample.attach('click', function(callback) {
    console.log('round 1: bananas');
    console.log(this);
    callback();
});
sample.launch('click');

// instantiate
sample = (new RecursiveEvents());

// sample with data passed in
sample.attach('custom.click', function(data, callback) {
    console.log('round 2: apples');
    console.log(data);
    callback();
});
sample.attach('custom.click', function(data, callback) {
    console.log('round 2: bananas');
    console.log(data);
    console.log(this);
    callback();
});
sample.launch('custom.click', ['Fruit!']);
```

### Output

    round 1: apples
    round 1: bananas
    fn
    round 2: apples
    Fruit!
    round 2: bananas
    Fruit!
    fn

There are a few things to note here:  
The ordering of console logs are sequential. Originally I had had them reverse,
and then thought "Hey! That doesn't make any sense!". They're called and
launched in the order that they're added, with the following stack-positions'
function passed as the callback argument.

Also, the scope of `this`: it'll always be the instance that the event is being
called against. In this case, the `obj` `RecursiveEvents` instance.

You may have noticed that the event-bindings aren't reserved to
classical-semantics. That is, `click` or `hover` or whatnot. It's just a string
that is used for referencing, so it can be anything. I find this helpful for
binding events to objects that don't behave in the semantic world around mouse
or keyboard interactions.

A great example for me is
[Twitter Boostrap's](http://twitter.github.com/bootstrap/) Accordion/Collapse
plugin. I wanted to bind events like `collapse` to it, and should have the right
to :P

Finally, the `data` and `callback` parameters. The `callback` parameter will
always be the last passed into a callback. If no data is passed into the
`launch` call, none will naturally be passed to the callback.

`data` that is passed to the `launch` method expects an array of parameters, and
ought to be received as a series of parameters by the receiving callback.
