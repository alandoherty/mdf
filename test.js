var mdf = require("./index");
var mdl = mdf.parseFile("test.mdl", function(err, definitions) {
    if (err) throw err;
    else {
        for (var i = 0; i < definitions.length; i++) {
            var obj = definitions[i];
            obj.dump();
        }
    }
});