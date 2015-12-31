/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Exports the module.
 */

var Parser = require("./classes/Parser"),
    Registry = require("./classes/Registry");

// default
var _globalRegistry = new Registry();

// mdf
var mdf = {
    /**
     * The tokenizer class.
     */
    Tokenizer : Parser.Tokenizer,

    /**
     * The parser class.
     */
    Parser : Parser.Parser,

    /**
     * The registry class.
     */
    Registry : Registry,

    /**
     * Loads a definition into the global registry.
     * @param {string} str The definition string.
     * @returns {boolean} If successful.
     */
    load: function(str) {
        _globalRegistry.load(str);
    },

    /**
     * Loads a file into the global registry.
     * @param {string} path The path.
     * @param {function} callback The callback on completion.
     */
    loadFile: function(path, callback) {
        _globalRegistry.loadFile(path, callback);
    },

    /**
     * Gets a list of the most recent errors.
     * @returns {object[]}
     */
    getErrors: function() {
        return _globalRegistry.getErrors();
    },

    /**
     * Gets all model definitions.
     * @returns {object}
     */
    getModels: function() {
        return _globalRegistry.getModels()
    },

    /**
     * Gets all enum definitions.
     * @returns {object}
     */
    getEnums: function() {
        return _globalRegistry.getEnums()
    },

    /**
     * Gets all type definitions.
     * @returns {object}
     */
    getTypeDefs: function() {
        return _globalRegistry.getTypeDefs()
    },

    /**
     * Gets the global registry.
     * @returns {Registry}
     */
    getGlobalRegistry: function() {
        return _globalRegistry;
    }
};

// export
module.exports = mdf;