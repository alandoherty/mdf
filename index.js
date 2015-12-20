/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Exports the module.
 */

var Parser = require("./Parser"),
    fs = require("fs");

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
     * Parses a string.
     * @param {string} str
     */
    parse: function(str) {
        // tokenize
        var tokenizer = new Parser.Tokenizer(str);

        if (!tokenizer.tokenize())
            return {valid: false, errors: tokenizer.getErrors()};

        // parse
        var parser = new Parser.Parser(tokenizer.getTokens());

        if (!parser.parse())
            return {valid: false, errors: parser.getErrors()};

        return parser.buildDefinitions();
    },

    /**
     * Parses a file.
     * @param {string} path The path.
     * @param {string?} encoding The encoding.
     * @param {function} callback The callback.
     */
    parseFile: function(path, encoding, callback) {
        // check parameters
        if (typeof(path) !== "string") throw "expected parameter 'path' to be a string";

        var _encoding = encoding;
        var _callback = callback;

        if (callback == undefined) {
            _callback = encoding;
            _encoding = "utf8";
        } else if (callback == undeifned && encoding == undefined) {
            _encoding = "utf8";
        }

        // read
        fs.readFile(path, _encoding, function(err, data) {
            if (err) _callback(err);
            else
                _callback(null, mdf.parse(data));
        });
    }
};

// export
module.exports = mdf;