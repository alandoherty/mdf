# mdf
A format for defining models through external schemas

# Example

app.js
```
var mdf = require("mdf");

mdf.parseFile("myMdl.mdl", function(err, results) {
  if (err) {
    console.log("oh no");
  } else {
    var definition = results[0];
    definition.dump();
  }
});
```

myMdl.mdl
```
model Testing : "test_tbl" { 
  public string firstName;
  public string lastName;
  secret bool isCool = true;
}
```
