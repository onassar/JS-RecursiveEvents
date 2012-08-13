
// <klass> dependency
if (typeof klass !== 'function') {
    throw new Error(
        '<klass> library is required. Please see: ' +
        'http://dustindiaz.com/klass'
    );
}

/**
 * RecursiveEvents
 * 
 * Provides a minimalistic extension of the <klass> library to allow for "event"
 * binding to be performed recursively.
 * 
 * That is, each call against an event (eg. this.launch('click')), will pass
 * along a callback function to be run, in the order that they were bound using
 * the <attach> method.
 * 
 * This allows for a more robust event-handling flow, whereby callbacks can
 * continue up the chain.
 * 
 * @todo   Think about adding in an optional parameter to the <launch> method
 *         which will have stack be called in reverse-order.
 * @note   Private (double-underscore) variables are used to minimize
 *         possibility of namespace-conflicts
 * @see    <https://github.com/ded/klass>
 * @see    <http://dustindiaz.com/klass>
 * @author Oliver Nassar <onassar@gmail.com>
 * @public
 */
var RecursiveEvents = klass({

    /**
     * __events
     * 
     * Stores binding-keys (eg. click, submit) for recursive events, along with
     * their respective callbacks.
     * 
     * A <stack> array is also defined for use when an "event" is <launch>'d.
     * 
     * @protected
     * @param     Object
     */
    __events: {},

    /**
     * __strict
     * 
     * @protected
     * @param     Boolean (default: true)
     */
    __strict: true,

    /**
     * init
     * 
     * Because of how the <klass> library works, the constructor needs to be
     * call in order to reset the <__events> object.
     * 
     * @public
     * @param  Boolean strict
     * @return void
     */
    initialize: function(strict) {
        this.__strict = strict === undefined ? this.__strict : strict;
        this.__events = {};
    },

    /**
     * attach
     * 
     * Attachs an event to this class-instance by storing the binding and
     * callback function.
     * 
     * The <stack> array is defined here, as outlined above, on each object that
     * gets created for a binding.
     * 
     * This is preferential than an instance-wide <stack> array (which I had
     * previously), as it allows for executing more than one binding per
     * instance, at one time.
     * 
     * For example, you can call obj.launch('click'), and within that callstack,
     * run obj.launch('submit'). This is only possible when the executing-stack
     * is stored relative to the binding-type.
     * 
     * Returns <this> to allow for chaining events-bindings.
     * 
     * @public
     * @param  String bind
     * @param  Function fn
     * @return Fn
     */
    attach: function(bind, fn) {
        if (this.__events[bind]) {
            this.__events[bind].callbacks.push(fn);
        }
        else {
            this.__events[bind] = {
                stack: [],
                callbacks: [fn]
            };
        }
        return this;
    },

    /**
     * launch
     * 
     * Recursively calls the callbacks for the <bind> binding, passing along any
     * data to each subsequent callback defined by the <data> array argument.
     * 
     * Worth noting is that if the <launch> method is called with a binding that
     * hadn't been attached to the object (eg. having attached a <click>
     * binding, but then attempting to launch a <clickk> binding), it will, by
     * default, throw an error.
     * 
     * To have it fail silently, do so through the constructor method
     * <initialize>.
     * 
     * I chose the default behaviour to be throwing an error, rather than
     * failing silently, since for me, I want to know when I'm making calls to
     * launch bindings that were never attached. I think it's indicative of
     * other issues that may be at hand when I'm making <launch> calls under
     * the presumption that they were added.
     * 
     * @public
     * @param  String bind
     * @param  Array data
     * @param  Boolean|null clone
     * @return void
     */
    launch: function(bind, data, clone) {

        /**
         * If there isn't an explicit call *not* to clone the event stack, clone
         * it to preserve the running of the binding again after this iteration.
         * 
         * This clone is needed since arrays are passed around by reference, and
         * unshifting them as done below would remove them from the
         * local-storage above.
         * 
         * I do something curious below; I do a check to see if any events are
         * bound to the binding <bind>. If there aren't, I either throw an
         * error, or fail silently, depending on the <__strict> boolean defined
         * on the instance. That's not the curious part.
         * 
         * The curious part is that I could have simply thrown a <return>
         * statement in the condition where it ought to have failed silently,
         * but instead I define a variable <empty>, set it to <true> in that
         * case, and then do a check below against that variable.
         * 
         * I do this, because when I define a function's return value as <void>,
         * as done in the method-signature above, I don't think it makes sense
         * to use the <return> operator. I want my methods to either return
         * something, and be defined as such, or not to. This is my OCPD coming
         * in here, and the cost of that is a little more complexity to this
         * library, but hey! It's my project!
         */
        var empty = false;
        if (clone === undefined) {

            // no events are bound to this binding
            if (this.__events[bind] === undefined) {

                // if it's a strict instantiation
                if (this.__strict === true) {
                    throw new Error(
                        'Binding <' + bind + '> isn\'t valid within the ' +
                        'context of this object'
                    );
                }

                // fail silently
                empty = true;
            } else {

                // make the clone
                this.__events[bind].stack = this.__events[bind].callbacks.slice() || [];
            }
        }

        // if there are events bound for this binding
        if (empty === false) {

            // events left in this binding's call-stack
            if (this.__events[bind].stack.length > 0) {
    
                /**
                 * Set the scope for function-calling; get the oldest-callback
                 * function; redefine the data incase none was passed in
                 */
                var self = this,
                    fn = this.__events[bind].stack.shift(),
                    data = data || [];
    
                /**
                 * There is a bug when the data passed into this <launch> method
                 * is the special <arguments> object, which behaves like an
                 * array.
                 * 
                 * While it behaves like an array, it doesn't contain
                 * array-native methods, and fails upon trying to use them. The
                 * following is a way to get around this by ensuring that the
                 * <data> variable passed in has the neccessary methods
                 * available for the rest of the logi.
                 * 
                 * @see <https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Functions_and_function_scope/arguments>
                 */
                data = Array.prototype.slice.call(data);
    
                // include the callback as the last argument passed to the function
                if (this.__events[bind].stack.length > 0) {
                    data.push(function() {
                        self.launch(bind, data, false);
                    });
                }
                // oterhwise, there are no more callbacks
                else {
                    data.push(function() {});
                }
                
                /**
                 * Set the scope to be <this>, a reference to this instantiation,
                 * since it was called against <this> in the first place.
                 */
                fn.apply(this, data);
            }
        }
    }
});
