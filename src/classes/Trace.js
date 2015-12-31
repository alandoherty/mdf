/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Holds trace information for definitions.
 */

var utils = require("../utils");

// export
module.exports = utils.class_("Trace", {
    /**
     * @private
     */
    _line: 0,

    /**
     * @private
     */
    _offset: 0,

    /**
     * @private
     */
    _path: "",

    /**
     * Gets the line number.
     * @returns {number}
     */
    getLine: function() {
        return this._line;
    },

    /**
     * Gets the offset on the line.
     * @returns {number}
     */
    getOffset: function() {
        return this._offset;
    },

    /**
     * Gets the path.
     * @returns {string}
     */
    getPath: function() {
        return this._path;
    },

    /**
     * Creates a new trace.
     * @param {number} line The line number.
     * @param {number} offset The offset.
     * @param {string} path The path.
     */
    constructor: function(line, offset, path) {
        this._line = line;
        this._offset = offset;
        this._path = path;
    }
});