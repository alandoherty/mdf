/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Parses the model tokens.
 */

var utils = require("../utils"),
    Model = require("./Model"),
    Enum = require("./Enum"),
    TypeDef = require("./TypeDef"),
    Trace = require("./Trace");

/**
 * The schema tokenizer enums.
 */
var T_STATE_I = 0;
var T_STATE_START = T_STATE_I++;
var T_STATE_STRING = T_STATE_I++;
var T_STATE_IDENTIFIER = T_STATE_I++;
var T_STATE_LINECOMMENT = T_STATE_I++;
var T_STATE_MULTILINECOMMENT = T_STATE_I++;
var T_STATE_NUMBER = T_STATE_I++;

var TOK_I = 0;
var TOK_STRING = TOK_I++;
var TOK_EQUALS = TOK_I++;
var TOK_COLON = TOK_I++;
var TOK_BRACEOPEN = TOK_I++;
var TOK_BRACECLOSE = TOK_I++;
var TOK_IDENTIFIER = TOK_I++;
var TOK_LESSTHAN = TOK_I++;
var TOK_GREATERTHAN = TOK_I++;
var TOK_KEYWORD = TOK_I++;
var TOK_BRACKOPEN = TOK_I++;
var TOK_BRACKCLOSE = TOK_I++;
var TOK_SEMICOLON = TOK_I++;
var TOK_NUMBER = TOK_I++;
var TOK_BOOLEAN = TOK_I++;
var TOK_COMMA = TOK_I++;
var TOK_EOF = TOK_I++;

/**
 * Converts a token to a string.
 * @param {number} type The token type.
 * @returns {string} The token name.
 */
function tokenToStr(type) {
    if (type == TOK_STRING) return "TOK_STRING";
    else if (type == TOK_EQUALS) return "TOK_EQUALS";
    else if (type == TOK_BRACEOPEN) return "TOK_BRACEOPEN";
    else if (type == TOK_BRACECLOSE) return "TOK_BRACECLOSE";
    else if (type == TOK_IDENTIFIER) return "TOK_IDENTIFIER";
    else if (type == TOK_LESSTHAN) return "TOK_LESSTHAN";
    else if (type == TOK_GREATERTHAN) return "TOK_GREATERTHAN";
    else if (type == TOK_KEYWORD) return "TOK_KEYWORD";
    else if (type == TOK_BRACKOPEN) return "TOK_BRACKOPEN";
    else if (type == TOK_BRACKCLOSE) return "TOK_BRACKCLOSE";
    else if (type == TOK_SEMICOLON) return "TOK_SEMICOLON";
    else if (type == TOK_NUMBER) return "TOK_NUMBER";
    else if (type == TOK_BOOLEAN) return "TOK_BOOLEAN";
    else if (type == TOK_COLON) return "TOK_COLON";
    else if (type == TOK_COMMA) return "TOK_COMMA";
    else if (type == TOK_EOF) return "TOK_EOF";
    else return "TON_UNK";
}

/**
 * Symbols.
 */
var symbols = {
    "=" : TOK_EQUALS,
    "{" : TOK_BRACEOPEN,
    "}" : TOK_BRACECLOSE,
    "<" : TOK_LESSTHAN,
    ">" : TOK_GREATERTHAN,
    "(" : TOK_BRACEOPEN,
    ")" : TOK_BRACECLOSE,
    ";" : TOK_SEMICOLON,
    ":" : TOK_COLON,
    "," : TOK_COMMA
};

/**
 * Keywords
 */
var keywords = [
    "private",
    "public",
    "model",
    "secret",
    "enum",
    "import",
    "typedef"
];

var Tokenizer = utils.class_("Tokenizer", {
    /**
     * @private
     */
    _src: "",

    /**
     * @private
     */
    _tokens: [],

    /**
     * @private
     */
    _errors: [],

    /**
     * @private
     */
    _state: -1,

    /**
     * @private
     */
    _pos: -1,

    /**
     * @private
     */
    _line: -1,

    /**
     * @private
     */
    _offset: -1,

    /**
     * @private
     */
    _token: "",

    /**
     * The path being tokenised.
     * @private
     */
    _path: null,

    /**
     * Tokenizes the source input.
     * @returns {boolean} If successful.
     */
    tokenize: function() {
        // reset tokens & errors
        this._tokens = [];
        this._errors = [];

        // reset tokenizer values
        this._state = T_STATE_START;
        this._line = 1;
        this._offset = 1;
        this._token = "";

        for (this._pos = 0; this._pos < this._src.length; this._pos++) {
            // peek, seek and weep
            var c = this._src[this._pos],
                p = (this._pos > 0) ? this._src[this._pos - 1] : "\0",
                n = (this._pos + 1 == this._src.length) ? "\0" : this._src[this._pos + 1];

            // line/offset counting
            if (c == "\n") {
                this._line++;
                this._offset = 1;
            } else {
                this._offset++;
            }

            // states
            if (this._state == T_STATE_START) {
                if (c == "\"") {
                    this._transition(T_STATE_STRING);
                } else if (utils.isLetter(c) || c == "_") {
                    if (utils.isLetter(n) || n == "_")
                        this._transitionAndAdd(T_STATE_IDENTIFIER, c);
                    else
                        this._pushSToken(c, TOK_IDENTIFIER);
                } else if (utils.isDigit(c)) {
                    if (utils.isDigit(n) || n == ".")
                        this._transitionAndAdd(T_STATE_NUMBER, c);
                    else
                        this._pushSToken(c, TOK_NUMBER);
                } else if (c == "/" && n == "/") {
                    this._transition(T_STATE_LINECOMMENT);
                } else if (c == "/" && n == "*") {
                    this._transition(T_STATE_MULTILINECOMMENT);
                } else if (symbols.hasOwnProperty(c)) {
                    this._pushSToken(c, symbols[c]);
                }
            } else if (this._state == T_STATE_STRING) {
                this._tokenizeString(c,p,n);
            } else if (this._state == T_STATE_IDENTIFIER) {
                this._tokenizeIdentifier(c,p,n);
            } else if (this._state == T_STATE_LINECOMMENT) {
                this._tokenizeLineComment(c,p,n);
            } else if (this._state == T_STATE_MULTILINECOMMENT) {
                this._tokenizeMultilineComment(c,p,n);
            } else if (this._state == T_STATE_NUMBER) {
                this._tokenizeNumber(c,p,n);
            }
        }

        // check if string still open
        if (this._state == T_STATE_STRING) {
            this._error("string not terminated");
        }

        // append eof
        this._pushSToken("", TOK_EOF);

        return this._errors.length == 0;
    },

    _tokenizeString: function(c, p, n) {
        if (c == "\"")
            this._pushTokenAndTransition(TOK_STRING, T_STATE_START);
        else
            this._token += c;
    },

    _tokenizeIdentifier: function(c, p, n) {
        this._token += c;

        if (!utils.isLetterOrDigit(n) && n != "_") {
            var tokenLower = this._token.toLowerCase();

            if (keywords.indexOf(tokenLower) !== -1)
                this._pushTokenAndTransition(TOK_KEYWORD, T_STATE_START);
            else if (tokenLower == "false" || tokenLower == "true")
                this._pushTokenAndTransition(TOK_BOOLEAN, T_STATE_START);
            else
                this._pushTokenAndTransition(TOK_IDENTIFIER, T_STATE_START);
        }
    },

    _tokenizeLineComment: function(c, p, n) {
        if (c == "\n")
            this._transition(T_STATE_START);
    },

    _tokenizeMultilineComment: function(c, p, n) {
        if (p == "*" && c == "/")
            this._transition(T_STATE_START);
    },

    _tokenizeNumber: function(c, p, n) {
        this._token += c;

        if (!utils.isDigit(n) && n != ".") {
            this._pushTokenAndTransition(TOK_NUMBER, T_STATE_START);
        }
    },

    /**
     * Gets all produced errors.
     * @returns {Array}
     */
    getErrors: function() {
        return this._errors;
    },

    /**
     * Gets the source string.
     * @returns {string}
     */
    getSource: function() {
        return this._src;
    },

    /**
     * Gets all produced tokens.
     * @returns {Array}
     */
    getTokens: function() {
        return this._tokens;
    },

    /**
     * Dumps the tokens to console.
     */
    dumpTokens: function() {
        for (var i = 0; i < this._tokens.length; i++) {
            var token = this._tokens[i];
            console.log(tokenToStr(token.type) + "(" + i + ") -> " + token.token);
        }
    },

    /**
     * Sets the path for extra error information.
     * @param {string} path
     */
    setPath: function(path) {
        this._path = path;
    },

    /**
     * Transitions to another state.
     * @param state
     * @private
     */
    _transition: function(state) {
        this._state = state;
    },

    /**
     * Transitions to another state and adds a character to the current token.
     * @param {number} state The state.
     * @param {string} c The character.
     * @private
     */
    _transitionAndAdd: function(state, c) {
        this._transition(state);
        this._token += c;
    },

    /**
     * Pushes an error.
     * @param {string} errStr The error message.
     * @private
     */
    _error: function(errStr) {
        this._errors.push({
            str: errStr,
            line: this._line,
            offset: this._offset,
            pos: this._pos,
            path: this._path
        });
    },

    /**
     * Pushes the current token onto the list.
     * @param {number} type The token type.
     * @private
     */
    _pushToken: function(type) {
        this._pushSToken(this._token, type);
        this._token = "";
    },

    /**
     * Pushes the current token and transitions to the specified state.
     * @param {number} type The token type.
     * @param {number} state The state.
     * @private
     */
    _pushTokenAndTransition: function(type, state) {
        this._pushToken(type);
        this._transition(state);
    },

    /**
     * Pushes a token onto the list.
     * @param {string} token The token.
     * @param {number} type The token type.
     * @private
     */
    _pushSToken: function(token, type) {
        this._tokens.push({
            "token" : token,
            "type" : type,
            "line" : this._line,
            "offset" : this._offset - token.length
        })
    },

    /**
     * Creates a new tokenizer.
     * @param {string} input The input.
     */
    constructor: function(input) {
        // check parameters
        if (typeof(input) !== "string") throw "expected constructor parameter 'input' to be a string"
        + " got '" + typeof(input) + "'";

        this._src = input;
    }
});

/**
 * The parser enums.
 */

// export
var Parser = utils.class_("Parser", {
    /**
     * The errors.
     * @private
     */
    _errors: [],

    /**
     * The input tokens.
     * @private
     */
    _tokens: [],

    /**
     * The current position.
     * @private
     */
    _pos: 0,

    /**
     * The current token
     * @private
     */
    _current: {},

    /**
     * The model definitions.
     * @private
     */
    _models: {},

    /**
     * The enum definitions.
     * @private
     */
    _enums: {},

    /**
     * The type definitions.
     * @private
     */
    _typeDefs: {},

    /**
     * The importer.
     * @private
     */
    _importer: null,

    /**
     * The path.
     * @private
     */
    _path: null,

    /**
     * Gets the next token.
     * @private
     * @returns {object|null}
     */
    _next: function() {
        if (this._pos >= this._tokens.length) {
            return null;
        } else {
            this._current = this._tokens[this._pos];
            this._pos++;
            return this._current;
        }
    },

    /**
     * Peeks the next token.
     * @returns {object|null}
     * @private
     */
    _peek: function() {
        if (this._pos >= this._tokens.length)
            return null;
        else
            return this._tokens[this._pos];
    },

    /**
     * Accepts a token of the provided type.
     * @param {number} type The token type.
     * @returns {object|boolean}
     * @private
     */
    _accept: function(type) {
        var peek = this._peek();

        // check if any more tokens left
        if (peek == null) return false;

        if (peek.type == type)
            return this._next();
        else
            return false;
    },

    /**
     * Accepts a keyword of the provided text.
     * @param {string} keyword
     * @returns {boolean|object}
     * @private
     */
    _acceptKeyword: function(keyword) {
        var t_keyword = this._peek();

        if (t_keyword !== false && t_keyword.type == TOK_KEYWORD) {
            if (t_keyword.token.toLowerCase() != keyword.toLowerCase()) {
                return false;
            } else {
                return this._next();
            }
        } else {
            return false;
        }
    },

    /**
     * Expects a token of the provided type, erroring otherwise.
     * @param {number} type The token type.
     * @private
     */
    _expect: function(type) {
        var peek = this._peek();

        // check if any more tokens left
        if (peek == null) {
            this._error("expected '" + tokenToStr(type) + "', got 'TOK_EOF'");
            return false;
        }

        if (peek.type == type)
            return this._next();
        else {
            this._error("expected token '" + tokenToStr(type) + "', got '" + tokenToStr(peek.type) + "'");
            return false;
        }
    },

    /**
     * Expects a keyword, erroring otherwise.
     * @param {string} keyword The keyword.
     * @returns {boolean|object}
     * @private
     */
    _expectKeyword: function(keyword) {
        var t_keyword = this._expect(TOK_KEYWORD);

        if (t_keyword !== false) {
            if (t_keyword.token.toLowerCase() != keyword.toLowerCase()) {
                this._error("expected keyword '" + keyword + "', got '" + t_keyword.token + "'", t_keyword);
            } else {
                return t_keyword;
            }
        } else {
            return false;
        }
    },

    /**
     * Expects any value type, erroring otherwise.
     * @returns {boolean|object}
     * @private
     */
    _expectValue: function() {
        var peek = this._peek();

        // check if any more tokens left
        if (peek == null) {
            this._error("expected value type, got 'TOK_EOF'");
            return false;
        }

        if (peek.type == TOK_STRING || peek.type == TOK_NUMBER || peek.type == TOK_BOOLEAN)
            return this._next();
        else {
            this._error("expected value type, got '" + tokenToStr(peek.type) + "'");
            return false;
        }
    },

    /**
     * Converts the token into it's JS type.
     * @param {object} token The token.
     * @returns {string|boolean|number} The value.
     */
    _valueToStr: function(token) {
        if (token.type == TOK_NUMBER)
            return parseFloat(token.token);
        else if (token.type == TOK_BOOLEAN)
            return token.token === "true";
        else
            return token.token;
    },

    /**
     * Parses the tokens.
     * @returns {boolean}
     */
    parse: function() {
        // reset values
        this._errors = [];
        this._pos = 0;
        this._current = {};
        this._models = {};
        this._enums = {};
        this._typeDefs = {};

        // parse
        while(true) {
            if (this._accept(TOK_EOF) ) {
                return this._errors.length == 0;
            } else if (this._errors.length > 0) {
                return false;
            } else {
                var def = false;

                // expect a keyword of some type
                if (this._acceptKeyword("model")) {
                    def = this._parseModel();

                    if (def !== false)
                        this._models[def.name] = def;
                    else
                        return false;
                } else if (this._acceptKeyword("enum")) {
                    def = this._parseEnum();

                    if (def !== false)
                        this._enums[def.name] = def;
                    else
                        return false;
                } else if (this._acceptKeyword("typedef")) {
                    def = this._parseTypeDef();

                    if (def !== false)
                        this._typeDefs[def.name] = def;
                    else
                        return false;
                } else if (this._acceptKeyword("import")) {
                    if (!this._parseImport())
                        return false;
                } else {
                    // cause an error!
                    this._expectKeyword("model");
                }
            }
        }
    },

    /**
     * Parses a type definition.
     * @returns {boolean|{}}
     * @private
     */
    _parseTypeDef: function() {
        // get keyword (for tracing)
        var keyword = this._current;

        // get type name
        var name = this._expect(TOK_IDENTIFIER);
        if (name == false) return false;

        // get type
        var type = this._parseType();
        if (type == false) return false;

        // optional semicolon
        this._accept(TOK_SEMICOLON);

        // build definition
        var def = {};
        def.name = name.token;
        def.type = type;
        def.trace = new Trace(keyword.line, keyword.offset, this._path);

        return def;
    },

    /**
     * Parses an enum.
     * @returns {boolean|{}}
     * @private
     */
    _parseEnum: function() {
        // get keyword (for tracing)
        var keyword = this._current;

        // get enum name
        var name = this._expect(TOK_IDENTIFIER);
        if (name == false) return false;

        // brace open
        if (this._expect(TOK_BRACEOPEN) == false)
            return false;

        // fields
        var values = [];
        var valuesTrace = [];

        while (true) {
            // brace close
            if (this._accept(TOK_BRACECLOSE) != false)
                break;

            // get value
            var value = this._expect(TOK_IDENTIFIER);
            if (value == false) return false;

            values.push(value.token);
            valuesTrace.push(new Trace(value.line, value.offset, this._path));

            // accept comma, or expect brace close
            if (!this._accept(TOK_COMMA)) {
                if (!this._expect(TOK_BRACECLOSE))
                    return false;
                else
                    break;
            }
        }

        // optional semicolon
        this._accept(TOK_SEMICOLON);

        // build definition
        var def = {};
        def.name = name.token;
        def.values = values;
        def.trace = new Trace(keyword.line, keyword.offset, this._path);
        def.valuesTrace = valuesTrace;

        return def;
    },

    /**
     * Parses an import.
     * @returns {boolean}
     * @private
     */
    _parseImport: function() {
        // get file
        var file = this._expect(TOK_STRING);

        if (this._importer == null) {
            this._error("import failed, no importer set");
            return false;
        } else {
            // get data
            var data = this._importer(this._path, file.token);

            if (data == false) {
                this._error("import failed, cannot find path '" + file.token + "'");
                return false;
            } else {
                // parse imported file
                var result = module.exports.parse(data, this._importer, file.token, true);

                // check if parse successful
                var i = "";

                if (result.valid) {
                    // push all models
                    for (i in result.models) {
                        if (!result.models.hasOwnProperty(i))
                            continue;

                        this._models[i] = result.models[i];
                    }

                    // push all enums
                    for (i in result.enums) {
                        if (!result.enums.hasOwnProperty(i))
                            continue;

                        this._enums[i] = result.enums[i];
                    }

                    // push all type defs
                    for (i in result.typeDefs) {
                        if (!result.typeDefs.hasOwnProperty(i))
                            continue;

                        this._typeDefs[i] = result.typeDefs[i];
                    }
                } else {
                    // push all errors
                    for (i = 0; i < result.errors.length; i++)
                        this._errors.push(result.errors[i]);
                }
            }
        }

        // optional semicolon
        this._accept(TOK_SEMICOLON);

        return true;
    },

    /**
     * Parses the definition.
     * @returns {boolean|object}}
     * @private
     */
    _parseModel: function() {
        // get keyword (for tracing)
        var keyword = this._current;

        // get model name
        var name = this._expect(TOK_IDENTIFIER);
        if (name == false) return false;

        // get table
        var table = undefined;

        if (this._accept(TOK_COLON)) {
            table = this._expect(TOK_STRING);
            if (table == false) return false;
        }

        // brace open
        if (this._expect(TOK_BRACEOPEN) == false)
            return false;

        // fields
        var fields = {};
        var fieldsTrace = {};

        while (true) {
            // brace close
            if (this._accept(TOK_BRACECLOSE) != false)
                break;

            // get field
            var field = this._parseField();
            if (field == false) return false;

            // push
            fields[field.name] = field;
            fieldsTrace[field.name] = field.trace;

            delete field.trace;
        }

        // optional semicolon
        this._accept(TOK_SEMICOLON);

        // build definition
        var def = {};
        def.name = name.token;
        if (table !== undefined) def.table = table.token;
        def.fields = fields;
        def.trace = new Trace(keyword.line, keyword.offset, this._path);
        def.fieldsTrace = fieldsTrace;

        return def;
    },

    /**
     * Parses a field.
     * @returns {boolean|object}
     * @private
     */
    _parseField: function() {
        // visibility
        var visibility = "private";
        var traceToken = null;

        if (this._acceptKeyword("public") || this._acceptKeyword("secret") || this._acceptKeyword("private")) {
            visibility = this._current.token;
            traceToken = this._current;
        }

        // type
        var type = this._parseType(true);
        if (type == false) return false;

        if (traceToken == null)
            traceToken = type.trace;
        delete type.trace;

        // name
        var name = this._expect(TOK_IDENTIFIER);
        if (name == false) return false;

        // default
        var default_ = undefined;

        if (this._accept(TOK_EQUALS)) {
            var value = this._expectValue();

            if (!value)
                return false;
            else
                default_ = value;
        }

        // semicolon
        if (this._expect(TOK_SEMICOLON) == false)
            return false;

        // build field
        var field = {};
        field.type = type;
        field.visibility = visibility;
        field.name = name.token;
        if (default_ !== undefined) field.def = this._valueToStr(default_);
        field.trace = new Trace(traceToken.line, traceToken.offset, this._path);

        return field;
    },

    /**
     * Sets the importer handler.
     * @param {function} importer
     */
    setImporter: function(importer) {
        this._importer = importer;
    },

    /**
     * Sets the path for extra error information.
     * @param {string} path
     */
    setPath: function(path) {
        this._path = path;
    },

    /**
     * Parses a type.
     * @param {boolean?} trace Provide trace information.
     * @returns {object|boolean}
     * @private
     */
    _parseType: function(trace) {
        // type name
        var type = this._expect(TOK_IDENTIFIER);
        if (type == false) return false;

        // type parameter
        var param = undefined;

        if (this._accept(TOK_LESSTHAN)) {
            param = this._parseType();
            if (param == false) return false;

            if (this._expect(TOK_GREATERTHAN) == false)
                return false;
        }

        // options
        var options = undefined;
        if (this._accept(TOK_BRACEOPEN)) {
            options = this._expectValue();
            if (param == false) return false;

            if (this._expect(TOK_BRACECLOSE) == false)
                return false;
        }

        // build type data
        var typeData = {};
        typeData.name = type.token;
        if (param !== undefined) typeData.param = param;
        if (options !== undefined) typeData.options = options.token;
        if (trace === true) typeData.trace = type;

        return typeData;
    },

    /**
     * Gets the fields.
     * @returns {Array}
     */
    getFields: function() {
        return this._fields;
    },

    /**
     * Gets the table.
     * @returns {string}
     */
    getTable: function() {
        return this._tbl;
    },

    /**
     * Builds the model definitions.
     * @returns {object}
     */
    buildModels: function() {
        var models = {};

        for(var i in this._models) {
            if (!this._models.hasOwnProperty(i))
                continue;

            // get model definition
            var model = this._models[i];

            var obj = new Model(model.name, model.hasOwnProperty("table") ? model.table : false, model.fields);
            obj._trace = model.trace;
            obj._fieldsTrace = model.fieldsTrace;
            models[model.name] = obj;
        }

        return models;
    },

    /**
     * Builds the enum definitions.
     * @returns {object}
     */
    buildEnums: function() {
        var enums = {};

        for(var i in this._enums) {
            if (!this._enums.hasOwnProperty(i))
                continue;

            // get enum definition
            var enum_ = this._enums[i];

            var obj = new Enum(enum_.name, enum_.values);
            obj._trace = enum_.trace;
            obj._valuesTrace = enum_.valuesTrace;
            enums[enum_.name] = obj;
        }

        return enums;
    },

    /**
     * Builds the type definition.
     * @returns {object}
     */
    buildTypeDefs: function() {
        var typeDefs = {};

        for(var i in this._typeDefs) {
            if (!this._typeDefs.hasOwnProperty(i))
                continue;

            // get type definition
            var typeDef = this._typeDefs[i];

            var obj = new TypeDef(typeDef.name, typeDef.type);
            obj._trace = typeDef.trace;
            typeDefs[typeDef.name] = obj;
        }

        return typeDefs;
    },

    /**
     * Pushes an error.
     * @param {string} errStr The error message.
     * @param {object?} token The target token.
     * @private
     */
    _error: function(errStr, token) {
        // use current or specified token
        if (token == undefined)
            token = this._current;
        if (token == null || Object.keys(token).length == 0)
            token = this._tokens[0];

        // push
        this._errors.push({
            str: errStr,
            line: token.line,
            offset: token.offset,
            path: this._path
        });
    },

    /**
     * Gets all produced errors.
     * @returns {Array}
     */
    getErrors: function() {
        return this._errors;
    },

    /**
     * Creates a new parser.
     * @param {Array} tokens The tokens.
     */
    constructor: function(tokens) {
        this._tokens = tokens;
        this._path = null;
    }
});

// export
module.exports = {
    Tokenizer: Tokenizer,
    Parser: Parser,

    /**
     * Parses the input string.
     * @param {string} str The definition file string.
     * @param {function} importer The importer.
     * @param {string?} path The path.
     * @param {boolean?} rawData If to produce raw definitions.
     * @returns {object}
     */
    parse: function(str, importer, path, rawData) {
        // tokenize
        var tokenizer = new Tokenizer(str);

        if (path !== undefined && path !== null)
            tokenizer.setPath(path);

        if (!tokenizer.tokenize())
            return {valid: false, errors: tokenizer.getErrors()};

        // parse
        var parser = new Parser(tokenizer.getTokens());
        parser.setImporter(importer);

        if (path !== undefined)
            parser.setPath(path);

        if (!parser.parse())
            return {valid: false, errors: parser.getErrors()};

        return {
            valid: true,
            models: rawData ? parser._models : parser.buildModels(),
            enums: rawData ? parser._enums : parser.buildEnums(),
            typeDefs: rawData ? parser._typeDefs : parser.buildTypeDefs()
        };
    }
};