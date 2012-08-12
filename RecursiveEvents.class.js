
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
 * along a callback function to be run, in the reverse order that they were
 * bound using the <attach> method.
 * 
 * This allows for a more robust event-handling flow, whereby callbacks can
 * continue up the chain.
 * 
 * @see    <https://github.com/ded/klass>
 * @see    <http://dustindiaz.com/klass>
 * @author Oliver Nassar <onassar@gmail.com>
 * @public
 */
var RecursiveEvents = klass({

    /**
     * _events
     * 
     * Stores binding-keys (eg. click, submit) for recursive events, along with
     * their respective callbacks.
     * 
     * A <stack> array is also defined for use when an "event" is <launch>'d.
     * 
     * @protected
     * @param     Object
     */
    _events: {},

    /**
     * _strict
     * 
     * @protected
     * @param     Boolean (default: true)
     */
    _strict: true,

    /**
     * init
     * 
     * @public
     * @param  Boolean strict
     * @return void
     */
    initialize: function(strict) {
        this._strict = strict === undefined ? this._strict : strict;
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
     * @public
     * @param  String bind
     * @param  Function fn
     * @return void
     */
    attach: function(bind, fn) {
        if (this._events[bind]) {
            this._events[bind].callbacks.unshift(fn);
        }
        else {
            this._events[bind] = {
                stack: [],
                callbacks: [fn]
            };
        }
    },

    /**
     * launch
     * 
     * Recursively calls the callbacks for the <bind> binding, passing along any
     * data to each subsequent callback defined by the <data> array argument.
     * 
     * Worth noting is that if the <launch> method is called with a binding that
     * hadn't been attached to the object (eg. having attached a <click>
     * binding, but then attempting to launch a <clickk> binding), it will by
     * default throw an error.
     * 
     * To have it fail silently, do so through the constructor method
     * <initialize>.
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
         * error, or fail silently, depending on the <_strict> boolean defined
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
            if (this._events[bind] === undefined) {

                // if it's a strict instantiation
                if (this._strict === true) {
                    throw new Error(
                        'Binding <' + bind + '> isn\'t valid within the ' +
                        'context of this object'
                    );
                }

                // fail silently
                empty = true;
            } else {

                // make the clone
                this._events[bind].stack = this._events[bind].callbacks.slice() || [];
            }
        }

        // if there are events bound for this binding
        if (empty === false) {

            // events left in this binding's call-stack
            if (this._events[bind].stack.length > 0) {
    
                /**
                 * Set the scope for function-calling; get the latest callback
                 * function; redefine the data incase none was passed in
                 */
                var self = this,
                    fn = this._events[bind].stack.shift(),
                    data = data || [];
    
                // include the callback as the last argument passed to the function
                if (this._events[bind].stack.length > 0) {
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
