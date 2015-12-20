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

        return {valid: true, definitions: parser.buildDefinitions()};
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
            if (err)  {
                _callback(true, [{"str" : "couldn't open file path", "line": 0, "offset": 0}]);
            } else {
                var result = mdf.parse(data);

                if (result.valid == false)
                    _callback(true, result.errors);
                else
                    _callback(false, result.definitions);
            }
        });
    },

    /**
     * Prints a list of errors to console.
     * @param {Array} errorList The error list.
     */
    printErrors: function(errorList) {
        for (var i = 0; i < errorList.length; i++) {
            var error = errorList[i];
            console.log(error.str + " on line " + error.line + ":" + error.offset);
        }
    }
};

// export
module.exports = mdf;