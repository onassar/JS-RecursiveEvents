
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
         */
        if (clone === undefined) {
            this._events[bind].stack = this._events[bind].callbacks.slice() || [];
        }

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
});
