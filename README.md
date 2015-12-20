[![npm version](https://badge.fury.io/js/mdf.svg)](https://badge.fury.io/js/mdf)

A format for defining models through external schemas, allowing you to better interact and publish information, maintaining important characteristics such as visibility to the end user.

# Installing

```bash
$ npm install mdf
```

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

# Testing

```bash
$ npm install mdf
$ npm test
```
