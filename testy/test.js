var mdf = require("../src/index");
var mdl = mdf.parseFile("testy/test.mdl", function(err, definitions) {
    if (err) {
        for (var i = 0; i < definitions.length; i++) {
            var error = definitions[i];
            console.log(error.str + " on line " + error.line);
        }
    } else {
        for (var i = 0; i < definitions.length; i++) {
            var obj = definitions[i];
            obj.dump();
        }
    }
});