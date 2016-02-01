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
    path = require("path"),
    TaskQueue = require("../utilities/TaskQueue");

/**
 * Loads all files in the specified directory.
 * @param {string} dir
 * @param {string|[]} filetype
 * @param {function} callback
 */
function getInDir(dir, filetype, callback) {
    // process filetype
    if (typeof(filetype) == "string")
        filetype = [filetype];

    // perform scandir
    fs.readdir(dir, function(err, files) {
        if (err) {
            callback([]);
            return;
        }

        // filter filetypes
        var _files = [];

        for (var i = 0; i < files.length; i++) {
            if (filetype.indexOf(path.extname(files[i])) !== -1)
                _files.push(files[i]);
        }

        // callback
        callback(_files);
    });
}

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
        var _models = {};

        // get all non-null models
        for (var k in this._models) {
            if (this._models.hasOwnProperty(k) && this._models[k] !== null)
                _models[k] = this._models[k];
        }

        return _models;
    },

    /**
     * Gets all enums in the registry.
     */
    getEnums: function() {
        var _enums = {};

        // get all non-null enums
        for (var k in this._enums) {
            if (this._enums.hasOwnProperty(k) && this._enums[k] !== null)
                _enums[k] = this._enums[k];
        }

        return _enums;
    },

    /**
     * Gets all type definitions in the registry.
     */
    getTypeDefs: function() {
        var _typeDefs = {};

        for (var k in this._typeDefs) {
            if (this._typeDefs.hasOwnProperty(k) && this._typeDefs[k] !== null)
                _typeDefs[k] = this._typeDefs[k];
        }

        return _typeDefs;
    },

    /**
     * Gets a model by name.
     * @param name
     */
    getModel: function(name) {
        if (!this._models.hasOwnProperty(name) && this._models[name] !== null)
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
        if (!this._typeDefs.hasOwnProperty(name) && this._typeDefs[name] !== null)
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
        if (!this._enums.hasOwnProperty(name) && this._enums[name] !== null)
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
     * @param {boolean} If to perform lazy validation.
     * @private
     */
    _validateModel: function(model, lazy) {
        // setup validation
        var errors = [];
        var trace = model.getTrace();

        // check for duplicate
        if (model._lazy == false && this._models.hasOwnProperty(model.getName())) {
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

                // skip type resolution for lazy validation, this is so we can
                // parse up all the definitions first incase we're loading out
                // of order.
                if (!resolvedType && !lazy) {
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
     * @param {string} path The path.
     * @param {boolean} lazy The lazy factor.
     * @private
     */
    _load: function(str, path, lazy) {
        // parse
        var result = Parser.parse(str, this._importer, path === undefined ? null : path, false);

        // check if parsed
        if (!result.valid) {
            this._errors = result.errors;
            return false;
        }

        var obj;
        var objRes;
        var errors = [];
        var i;

        // set enums
        for (i in result.enums) {
            if (!result.enums.hasOwnProperty(i))
                continue;

            obj = result.enums[i];
            objRes = {valid: true};

            if (objRes.valid) {
                obj._lazy = lazy;
                obj.setRegistry(this);

                // set enum
                this._enums[i] = obj;
            } else {
                errors = errors.concat(objRes.errors);
            }
        }

        // set typedefs
        for (i in result.typeDefs) {
            if (!result.typeDefs.hasOwnProperty(i))
                continue;

            obj = result.typeDefs[i];
            objRes = {valid: true};

            if (objRes.valid) {
                obj._lazy = lazy;
                obj.setRegistry(this);

                // set typedef
                this._typeDefs[i] = obj;
            } else {
                errors = errors.concat(objRes.errors);
            }
        }

        // set models
        for (i in result.models) {
            if (!result.models.hasOwnProperty(i))
                continue;

            obj = result.models[i];
            objRes = this._validateModel(obj, lazy);

            if (objRes.valid) {
                obj._lazy = lazy;
                obj.setRegistry(this);

                // set model
                this._models[i] = obj;
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
        return this._load(str, null, false);
    },

    /**
     * Loads all definitions in the array into the registry.
     * This function must be used if the definition files depend
     * on order.
     * @param {string[]} strArr
     * @returns {boolean} If successful.
     */
    loadAll: function(strArr) {
        // pre load
        for (var i = 0; i < strArr.length; i++) {
            if (!this._load(strArr[i], null, true))
                return false;
        }

        // load
        for (i = 0; i < strArr.length; i++) {
            if (!this._load(strArr[i], null, false))
                return false;
        }
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
                throw err;
            else
                callback(!obj._load(data, path, false));
        });
    },

    /**
     * Loads files into the registry.
     * This function must be used if the definition files depend
     * on order.
     * @param {string} pathArr The array of paths.
     * @param {function} callback The callback on completion.
     */
    loadAllFiles: function(pathArr, callback) {
        // check parameters
        if (!Array.isArray(pathArr)) throw "expected parameter 'path' to be an array";

        var obj = this;

        // default callback
        if (callback == undefined || callback == null)
            callback = function(err, msg) {};

        // create read queue
        var readQueue = new TaskQueue();

        // queue file reads and lazy loading
        var dataArr = [];

        for (var i = 0; i < pathArr.length; i++) {
            (function (i) {
                readQueue.queue(function (done) {
                    fs.readFile(pathArr[i], "utf8", function (err, data) {
                        if (err) {
                            throw err;
                        } else {
                            // add to array for later loading
                            dataArr[i] = data;

                            // load and parse
                            if (!obj._load(data, pathArr[i], true))
                                callback(true);
                            else
                                done();
                        }
                    });
                });
            })(i);
        }

        // queue real loading
        for (var i = 0; i < pathArr.length; i++) {
            (function (i) {
                readQueue.queue(function (done) {
                    if (!obj._load(dataArr[i], pathArr[i], false))
                        callback(true);
                    else
                        done();
                });
            })(i);
        }

        // execute
        readQueue.executeAll(function() {
            callback(false);
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