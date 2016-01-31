/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Represents a model definition.
 */

var utils = require("../utils"),
    Trace = require("./Trace");

// export
module.exports = utils.class_("Model", {
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
     * @internal
     */
    _trace: null,

    /**
     * @internal
     */
    _fieldsTrace: {},

    /**
     * @internal
     */
    _registry: null,

    /**
     * Gets the registry.
     * @param {Registry} registry
     * @returns {null}
     */
    getRegistry: function(registry) {
        return this._registry;
    },

    /**
     * Sets the registry.
     * @param {Registry} registry
     */
    setRegistry: function(registry) {
        this._registry = registry;
    },

    /**
     * Gets the trace information.
     * @returns {Trace}
     */
    getTrace: function() {
        return this._trace;
    },

    /**
     * Gets the trace information for a field.
     * @param {string} field The field name.
     * @returns {Trace|null}
     */
    getFieldTrace: function(field) {
        if (this._fieldsTrace.hasOwnProperty(field))
            return this._fieldsTrace[field];
        else
            return null;
    },

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
     * Builds the model definition into a final format by combining
     */
    build: function() {
        // check for registry
        if (this._registry == null)
            throw "The registry has not been set for the model";

        // create model
        var model = {
            name : this._name,
            table : this._tbl,
            trace : this._trace,
            fields : {},
            fieldsTrace: this._fieldsTrace
        };

        // build
        for (var f in this._fields) {
            // check own property
            if (!this._fields.hasOwnProperty(f))
                continue;

            // get field
            var field = this._fields[f];
            model.fields[f] = field;

            // check for typedefs
            if (this._registry.hasTypeDef(field.type.name) && !field.type.hasOwnProperty("param") && !field.type.hasOwnProperty("options")) {
                model.fields[f].type = this._registry.getTypeDef(field.type.name).getData();
                continue;
            }

            // check for model
            if (this._registry.hasModel(field.type.name)) {
                model.fields[f].type = {name: "ref", param: f};
                continue;
            }

            // check for enums
            if (this._registry.hasEnum(field.type.name)) {
                var enum_ = this._registry.getEnum(field.type.name);
                model.fields[f].type = {name: "enum", options: enum_.getValues()};
                continue;
            }
        }

        return model;
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
        this._registry = null;
    }
});