/**
     __  _______  ______
    /  |/  / __ \/ ____/
   / /|_/ / / / / /_
  / /  / / /_/ / __/
 /_/  /_/_____/_/

 @author Alan Doherty
 @purpose Parses the model tokens.
 */

var utils = require("./utils"),
    ModelDefinition = require("./ModelDefinition");

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
    "null"
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
            if (keywords.indexOf(this._token) !== -1)
                this._pushTokenAndTransition(TOK_KEYWORD, T_STATE_START);
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
        this._errors.push({str: errStr, line: this._line, offset: this._offset, pos: this._pos});
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
            "offset" : this._offset
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
     * The definitions.
     * @private
     */
    _definitions: [],

    /**
     * The current definition.
     * @private
     */
    _definition: {},

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
     * @param {string} type The token type.
     * @returns {object|boolean}
     * @private
     */
    _accept: function(type) {
        var peek = this._peek(type);

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
        var t_keyword = this._accept(TOK_KEYWORD);

        if (t_keyword !== false) {
            if (t_keyword.token.toLowerCase() != keyword.toLowerCase()) {
                return false;
            } else {
                return t_keyword;
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
                this._error("expected keyword '" + keyword + "', got '" + t_keyword.token + "'");
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
        var type = peek.type;

        // check if any more tokens left
        if (peek == null) {
            this._error("expected value type, got 'TOK_EOF'");
            return false;
        }

        if (peek.type == type)
            return this._next();
        else {
            this._error("expected value type, got '" + tokenToStr(peek.type) + "'");
            return false;
        }
    },

    /**
     * Parses the tokens.
     * @returns {boolean}
     */
    parse: function() {
        while(true) {
            if (this._accept(TOK_EOF) ) {
                return this._errors.length == 0;
            } else if (this._errors.length > 0) {
                return false;
            } else {
                var def = this._parseDefinition();

                if (def !== false)
                    this._definitions.push(def);
                else
                    return false;
            }
        }
    },

    /**
     * Parses the definition.
     * @returns {boolean|object}}
     * @private
     */
    _parseDefinition: function() {
        if (this._expectKeyword("model")) {
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

            while(true) {
                // brace close
                if (this._accept(TOK_BRACECLOSE) != false)
                    break;

                // get field
                var field = this._parseField();
                if (field == false) return false;

                fields[field.name] = field;
            }

            // build definition
            var def = {};
            def.name = name.token;
            if (table !== undefined) def.table = table.token;
            def.fields = fields;

            return def;
        } else {
            return false;
        }
    },

    /**
     * Parses a field.
     * @returns {boolean|object}
     * @private
     */
    _parseField: function() {
        // visibility
        var visibility = "private";

        if (this._acceptKeyword("public") || this._acceptKeyword("secret") || this._acceptKeyword("private")) {
            visibility = this._current.token;
        }

        // type
        var type = this._parseType();
        if (type == false) return false;

        // name
        var name = this._expect(TOK_IDENTIFIER);
        if (name == false) return false;

        // default
        var default_ = undefined;

        if (this._accept(TOK_EQUALS)) {
            var value = this._expectValue();

            if (!value)
                return false;
        }

        // semicolon
        if (this._expect(TOK_SEMICOLON) == false)
            return false;

        // build field
        var field = {};
        field.type = type;
        field.visibility = visibility;
        field.name = name.token;
        if (default_ !== undefined) field.def = default_.token;

        return field;
    },

    /**
     * Parses a type.
     * @returns {object|boolean}
     * @private
     */
    _parseType: function() {
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
        return this._table;
    },

    /**
     * Builds the definitions.
     */
    buildDefinitions: function() {
        var definitions = [];

        for (var i = 0; i < this._definitions.length; i++) {
            var def = this._definitions[i];

            definitions.push(new ModelDefinition(def.name, def.hasOwnProperty("table") ? def.table : false, def.fields));
        }

        return definitions;
    },

    /**
     * Pushes an error.
     * @param {string} errStr The error message.
     * @private
     */
    _error: function(errStr) {
        this._errors.push({str: errStr,
            line: this._current.line,
            offset: this._current.offset
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
    }
});

// export
module.exports = {
    Tokenizer: Tokenizer,
    Parser: Parser
};