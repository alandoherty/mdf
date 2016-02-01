var mdf = require("../src/index");
var TaskQueue = require("../src/utilities/TaskQueue");

mdf.loadAllFiles(["./testy/models/test.mdl", "./testy/models/hello.mdl"], function(err) {
    if (err) {
        console.error(mdf.getErrors());
        return;
    }

    console.log(mdf.getGlobalRegistry());
    console.log("woo");
});