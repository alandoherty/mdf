var mdf = require("../src/index");

mdf.loadFile("testy/test.mdl", function(err) {
    if (err) {
        console.error("error parsing file");
        console.error(mdf.getErrors());
    } else {
        var model = mdf.getModels()["User"].build();
        console.log(model.fields);
        console.log("success");
    }
});