[![npm version](https://badge.fury.io/js/mdf.svg)](https://badge.fury.io/js/mdf)

A format for defining models through external schemas, allowing you to better interact and publish information, maintaining important characteristics such as visibility to the end user.

# Installing

```bash
$ npm install mdf
```

# Example

app.js
```
var mdf = require("../src/index");

mdf.loadFile("test.mdl", function(err) {
    if (err) {
        console.error("error parsing file");
        console.error(mdf.getErrors());
    } else {
        console.log(mdf.getModels());
        console.log(mdf.getEnums());
        console.log(mdf.getTypeDefs());
    }
});
```

test.mdl
```
import "hello.mdl";

model User : "tbl_user" {
    public string firstName = "";
    string lastName = "";
    Email email;
    bool emailVerified = false;
    bool notifications;
    bool blocked;
    bool isPrivate;
    Password password;
    ref<Group> group;
    ref<string(48)> avatarUrls;
    State state;
}
```

hello.mdl
```
enum State {
    Potato,
    Mesh,
    Hole
}

typedef Email string(64)
typedef Password string(64)
```

# Testing

```bash
$ npm install mdf
$ npm test
```
