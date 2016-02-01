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
    fs = require("fs"),
    path = require("path");

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
    _typeDefs: {},

    /**
     * @private
     */
    _errors: [],

    /**
     * The default file importer.
     * @param {string} curPath The current path.
     * @param {string} importPath The path to import.
     * @private
     */
    _importer: function(curPath, importPath) {
        var obj = this;
        var curPathDir = path.dirname(curPath);

        // read
        try {
            if (fs.existsSync("./" + curPathDir + "/" + importPath))
                return fs.readFileSync("./" + curPathDir + "/" + importPath, "utf8");
            else if (fs.existsSync(importPath))
                return fs.readFileSync("./" + importPath, "utf8");
            else
                return false;
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
     * Gets all type definitions in the registry.
     */
    getTypeDefs: function() {
        return this._typeDefs;
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
     * Gets a typedef by name.
     * @param {string} name
     */
    getTypeDef: function(name) {
        if (!this._typeDefs.hasOwnProperty(name))
            return null;
        else
            return this._typeDefs[name];
    },

    /**
     * Checks if the type def exists.
     * @param {string} name The name.
     * @returns {boolean}
     */
    hasTypeDef: function(name) {
        return this.getTypeDef(name) != null;
    },

    /**
     * Gets a enum by name.
     * @param {string} name
     */
    getEnum: function(name) {
        if (!this._enums.hasOwnProperty(name))
            return null;
        else
            return this._enums[name];
    },

    /**
     * Checks if the enum exists.
     * @param {string} name The name.
     * @returns {boolean}
     */
    hasEnum: function(name) {
        return this.getEnum(name) != null;
    },

    /**
     * Validates an enum.
     * @param {Enum} enum_
     * @private
     */
    _validateEnum: function(enum_) {
        var errors = [];
        var trace = enum_.getTrace();

        // check for duplicate
        if (this._enums.hasOwnProperty(enum_.getName())) {
            errors.push({
                str: "Duplicate enum `" + enum_.getName() + "`",
                line: trace.getLine(),
                offset: trace.getOffset(),
                path: trace.getPath()
            });
        } else {
            /// TODO: enum validation
        }

        // return errors
        return {
            valid: errors.length == 0,
            errors: errors
        }
    },

    /**
     * Validates a model.
     * @param {Model} model
     * @private
     */
    _validateModel: function(model) {
        var errors = [];
        var trace = model.getTrace();

        // check for duplicate
        if (this._models.hasOwnProperty(model.getName())) {
            errors.push({
                str: "Duplicate model `" + model.getName() + "`",
                line: trace.getLine(),
                offset: trace.getOffset(),
                path: trace.getPath()
            });
        } else {
            // get fields
            var fields = model.getFields();

            // validate
            for (var f in fields) {
                if (!fields.hasOwnProperty(f))
                    continue;

                var resolvedType = false;
                var field = fields[f];
                var fieldTrace = model.getFieldTrace(f);

                // check typedefs
                if (this._typeDefs.hasOwnProperty(field.type.name))
                    resolvedType = true;

                // check enums
                if (this._enums.hasOwnProperty(field.type.name))
                    resolvedType = true;

                // check models
                if (this._models.hasOwnProperty(field.type.name))
                    resolvedType = true;

                // check base types
                if (utils.baseTypes.indexOf(field.type.name) !== -1) {
                    resolvedType = true;

                    // validate
                    var validateType = utils.validateType(field.type.name, field);

                    if (validateType !== true) {
                        errors.push({
                            str: validateType,
                            line: fieldTrace.getLine(),
                            offset: fieldTrace.getOffset(),
                            path: fieldTrace.getPath()
                        });
                    }
                }

                if (!resolvedType) {
                    errors.push({
                        str: "Invalid type `" + field.type.name + "` in `" + model.getName() + "`",
                        line: fieldTrace.getLine(),
                        offset: fieldTrace.getOffset(),
                        path: fieldTrace.getPath()
                    });
                }
            }
        }

        // return errors
        return {
            valid: errors.length == 0,
            errors: errors
        }
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
        var objRes = null;
        var errors = [];
        var i;

        // set enums
        for (i = 0; i < result.enums.length; i++) {
            obj = result.enums[i];
            objRes = {valid: true};

            if (objRes.valid) {
                obj.setRegistry(this);
                this._enums[obj.getName()] = obj;
            } else {
                errors = errors.concat(objRes.errors);
            }
        }

        // set typedefs
        for (i = 0; i < result.typeDefs.length; i++) {
            obj = result.typeDefs[i];
            objRes = {valid: true};

            if (objRes.valid) {
                obj.setRegistry(this);
                this._typeDefs[obj.getName()] = obj;
            } else {
                errors = errors.concat(objRes.errors);
            }
        }

        // set models
        for (i = 0; i < result.models.length; i++) {
            obj = result.models[i];
            objRes = this._validateModel(obj);

            if (objRes.valid) {
                obj.setRegistry(this);
                this._models[obj.getName()] = obj;
            } else {
                errors = errors.concat(objRes.errors);
            }
        }

        this._errors = errors;
        return errors.length == 0;
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

        var obj = this;

        // default callback
        if (callback == undefined || callback == null)
            callback = function(err, msg) {};

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
        this._typeDefs = {};
        this._errors = [];
    }
});