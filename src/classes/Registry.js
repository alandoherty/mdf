/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Loads and stores model definitions.
 */

var Parser = require("./Parser"),
    utils = require("../utils"),
    fs = require("fs");

// export
module.exports = utils.class_("Registry", {
    /**
     * @private
     */
    _models: {},

    /**
     * @private
     */
    _enums: {},

    /**
     * @private
     */
    _errors: [],

    /**
     * The default file importer.
     * @param {string} path The current path.
     * @param {string} importPath The path to import.
     * @private
     */
    _importer: function(path, importPath) {
        var obj = this;

        // read
        try {
            return fs.readFileSync(importPath, "utf8");
        } catch(e) {
            return false;
        }
    },

    /**
     * Gets a list of the most recent errors.
     * @returns {object[]}
     */
    getErrors: function() {
        return this._errors;
    },

    /**
     * Gets all models in the registry.
     */
    getModels: function() {
        return this._models;
    },

    /**
     * Gets all enums in the registry.
     */
    getEnums: function() {
        return this._enums;
    },

    /**
     * Gets a model by name.
     * @param name
     */
    getModel: function(name) {
        if (!this._models.hasOwnProperty(name))
            return null;
        else
            return this._models[name];
    },

    /**
     * Checks if the model definition exists.
     * @param {string} name The name.
     * @returns {boolean}
     */
    hasModel: function(name) {
        return this.getModel(name) != null;
    },

    /**
     * Loads a definition file (internal version).
     * @param {string} str The contents.
     * @param {string?} path The path.
     * @private
     */
    _load: function(str, path) {
        // parse
        var result = Parser.parse(str, this._importer, path === undefined ? null : path);

        // check if parsed
        if (!result.valid) {
            this._errors = result.errors;
            return false;
        }

        var obj = null;
        var i = 0;

        // set models
        for (i = 0; i < result.models.length; i++) {
            obj = result.models[i];
            this._models[obj.getName()] = obj;
        }

        // set enums
        for (i = 0; i < result.enums.length; i++) {
            obj = result.enums[i];
            this._enums[obj.getName()] = obj;
        }

        return true;
    },

    /**
     * Loads a definition into the registry.
     * @param {string} str The definition string.
     * @returns {boolean} If successful.
     */
    load: function(str) {
        return this._load(str);
    },

    /**
     * Loads a file into the registry.
     * @param {string} path The path.
     * @param {function} callback The callback on completion.
     */
    loadFile: function(path, callback) {
        // check parameters
        if (typeof(path) !== "string") throw "expected parameter 'path' to be a string";
        if (typeof(callback) !== "function") throw "expected parameter 'callback' to be a function";

        var obj = this;

        // read
        fs.readFile(path, "utf8", function(err, data) {
            if (err)
                callback(true);
            else
                callback(!obj._load(data, path));
        });
    },

    /**
     * Sets the importer callback to insert your own functionality
     * when a definition tries to import another file.
     * @param {function} callback
     */
    setImporter: function(callback) {
        // check parameters
        if (typeof(callback) !== "function") throw "expected parameter 'callback' to be a function";

        this._importer = callback;
    },

    /**
     * Creates a new registry.
     */
    constructor: function() {
        this._models = {};
        this._enums = {};
        this._errors = [];
    }
});