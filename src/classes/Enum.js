/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Represents an enum definition.
 */

var utils = require("../utils"),
    Trace = require("./Trace");

// export
module.exports = utils.class_("Enum", {
    /**
     * @private
     */
    _name: "",

    /**
     * @private
     */
    _values: [],

    /**
     * @internal
     */
    _trace: null,

    /**
     * @internal
     */
    _valuesTrace: [],

    /**
     * Gets the trace information.
     * @returns {Trace}
     */
    getTrace: function() {
        return this._trace;
    },

    /**
     * Gets the trace information for a value.
     * @param {string} value The value.
     * @returns {Trace|null}
     */
    getValueTrace: function(value) {
        for (var i = 0; i < this._values.length; i++) {
            if (this._values == value)
                return this._valuesTrace[i];
        }

        return null;
    },

    /**
     * Gets the enum's name.
     * @returns {string}
     */
    getName: function() {
        return this._name;
    },

    /**
     * Gets the values.
     * @returns {[]}
     */
    getValues: function() {
        return this._values;
    },

    /**
     * Gets if the value exists.
     * @param {string} name The value name.
     * @returns {boolean}
     */
    hasValue: function(name) {
        return this._values.indexOf(name) > -1;
    },

    /**
     * Creates a new enum definition.
     * @param {string} name The enum name.
     * @param {Array} values The values.
     */
    constructor: function(name, values) {
        // check parameters
        if (typeof(name) !== "string") throw "expected constructor parameter 'name' to be a string"
        + " got '" + typeof(name) + "'";
        if (typeof(values) !== "object" && Array.isArray(values)) throw "expected constructor parameter 'values' to be a array"
        + " got '" + typeof(values) + "'";

        this._name = name;
        this._values = values;
    }
});