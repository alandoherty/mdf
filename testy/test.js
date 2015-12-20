var mdf = require("../src/index");
var mdl = mdf.parseFile("testy/test.mdl", function(err, definitions) {
    if (err) {
        mdf.printErrors(definitions);
    } else {
        for (var i = 0; i < definitions.length; i++) {
            var obj = definitions[i];
            obj.dump();
        }
    }
});