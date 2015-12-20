/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Represents a model definition.
 */

var utils = require("./utils");

// export
module.exports = utils.class_("ModelDefinition", {
    /**
     * @private
     */
    _name: "",

    /**
     * @private
     */
    _tbl: "",

    /**
     * @private
     */
    _fields: {},

    /**
     * Gets the model's table.
     * @returns {string}
     */
    getTable: function() {
        if (typeof(this._tbl) == "string")
            return this._tbl;
        else
            return null
    },

    /**
     * Gets the model's name.
     * @returns {string}
     */
    getName: function() {
        return this._name;
    },

    /**
     * Gets the fields.
     * @returns {object}
     */
    getFields: function() {
        return this._fields;
    },

    /**
     * Gets if the field exists.
     * @param {string} name The field name.
     * @returns {boolean}
     */
    hasField: function(name) {
        return this._fields.hasOwnProperty(name);
    },

    /**
     * Dumps the definition to console.
     */
    dump: function() {
        console.log("model(" + this._name + ")" + ((this._tbl !== false) ? " -> " + this._tbl : ""));

        for (var f in this._fields) {
            if (this._fields.hasOwnProperty(f)) {
                var field = this._fields[f];

                console.log(field.visibility + " " + utils.typeToStr(field.type) + " " + field.name);
            }
        }
    },

    /**
     * Creates a new model definition.
     * @param {string} name The model name.
     * @param {string} tbl The table name.
     * @param {Array} fields The fields.
     */
    constructor: function(name, tbl, fields) {
        // check parameters
        if (typeof(name) !== "string") throw "expected constructor parameter 'name' to be a string"
        + " got '" + typeof(name) + "'";
        if (tbl !== false && typeof(tbl) !== "string") throw "expected constructor parameter 'tbl' to be a string"
        + " got '" + typeof(tbl) + "'";
        if (typeof(fields) !== "object" && Array.isArray(fields)) throw "expected constructor parameter 'fields' to be a array"
        + " got '" + typeof(fields) + "'";

        this._tbl = tbl;
        this._name = name;
        this._fields = fields;
    }
});