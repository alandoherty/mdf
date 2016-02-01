/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Various utilities.
 */

var utils = {
    /**
     * The base types.
     */
    baseTypes : [
        "string",
        "boolean",
        "integer",
        "decimal",
        "array",
        "custom",
        "ref"
    ],

    /**
     * Validates a field definition.
     * @param {string} type The type.
     * @param {string} field The field.
     * @returns {boolean|string}
     */
    validateType: function(type, field) {
        switch(type) {
            case "string":
                // requires options
                if (!field.type.options)
                    return "String field `" + field.name + "` requires length option";

                return true;
            case "array":
                // no default
                if (field.type.def)
                    return "Array field `" + field.name + "` cannot have default";

                return true;
            case "custom":
                // no param
                if (field.type.param)
                    return "Custom field type `" + field.name + "` cannot have type parameter";

                // requires options
                if (!field.type.options)
                    return "Custom field type `" + field.name + "` must specify type as option";

                return true;
            case "ref":
                // no options
                if (field.type.options)
                    return "Model reference field `" + field.name + "` cannot have options";

                // requires param
                if (!field.type.param)
                    return "Model reference field `" + field.name + "` must specify model as type parameter";

                return true;
            default:
                return true;
        }
    },

    /**
     * Creates a new class.
     * @param {string} name The name.
     * @param {object?} inherit The inherited type, optional.
     * @param {{}} tbl The reference table.
     * @retuens {object}
     */
    class_: function(name, inherit, tbl) {
        // process args
        var _tbl = arguments[arguments.length - 1];
        var _name = arguments[0];
        var _inherit = (arguments.length > 2) ? arguments[1] : null;

        // check arguments
        if (typeof(_name) !== "string") { module.exports.error("expected parameter `name` to be string"); return; }
        if (typeof(_inherit) !== "string" && _inherit !== null) { module.exports.error("expected parameter `inherit` to be string"); return; }
        if (typeof(_tbl) !== "object") { module.exports.error("expected parameter `tbl` to be object"); return; }

        // create class
        var obj = _tbl.hasOwnProperty("constructor") ? _tbl.constructor : function() {};

        if (_inherit !== null)
            obj.prototype = Object.create(_inherit.prototype);

        // add methods
        for (var k in _tbl) {
            if (k !== "constructor" && _tbl.hasOwnProperty(k))
                obj.prototype[k] = _tbl[k];
        }

        // add get type method
        obj.prototype.getType = function() {
            return _name;
        };

        return obj;
    },

    /**
     * Checks if the specified character is a letter.
     * @param {string} c The character.
     * @returns {boolean}
     */
    isLetter: function(c) {
        var code = c.charCodeAt(0);
        return ((code >= 65) && (code <= 90)) || ((code >= 97) && (code <= 122));
    },

    /**
     * Checks if the specified character is a digit.
     * @param {string} c The character.
     * @returns {boolean}
     */
    isDigit: function(c) {
        var code = c.charCodeAt(0);
        return (code > 47 && code < 58);
    },

    /**
     * Checks if the specified character is a digit or letter.
     * @param {string} c The character.
     * @returns {boolean}
     */
    isLetterOrDigit: function(c) {
        return utils.isDigit(c) || utils.isLetter(c);
    },

    /**
     * Converts a type data object to a string.
     * @param {object} typeData
     * @returns {string}
     */
    typeToStr: function(typeData) {
        var str = typeData.name;
        if (typeData.hasOwnProperty("param"))
            str += "<" + utils.typeToStr(typeData.param) + ">";
        if (typeData.hasOwnProperty("options"))
            str += "(" + typeData.options + ")";
        return str;
    }
};

// export
module.exports = utils;