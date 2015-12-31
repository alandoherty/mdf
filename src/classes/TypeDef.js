/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Represents a type definition.
 */

var utils = require("../utils"),
    Trace = require("./Trace");

// export
module.exports = utils.class_("TypeDef", {
    /**
     * @private
     */
    _name: "",

    /**
     * @private
     */
    _type: {},

    /**
     * @internal
     */
    _trace: null,

    /**
     * Gets the trace information.
     * @returns {Trace}
     */
    getTrace: function() {
        return this._trace;
    },

    /**
     * Gets the enum's name.
     * @returns {string}
     */
    getName: function() {
        return this._name;
    },

    /**
     * Gets the type.
     * @returns {{}}
     */
    getType: function() {
        return this._type;
    },

    /**
     * Creates a new type definition.
     * @param {string} name The enum name.
     * @param {{}} type The type.
     */
    constructor: function(name, type) {
        // check parameters
        if (typeof(name) !== "string") throw "expected constructor parameter 'name' to be a string"
        + " got '" + typeof(name) + "'";
        if (typeof(type) !== "object") throw "expected constructor parameter 'type' to be an object"
        + " got '" + typeof(type) + "'";

        this._name = name;
        this._type = type;
    }
});