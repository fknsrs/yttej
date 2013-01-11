#!/usr/bin/env node

var Yttej = require("./index");

var yttej = new Yttej();

["data", "sequence"].forEach(function(ev) {
  yttej.on(ev, console.log.bind(console, ev));
});

yttej.write("asdfqwer");
yttej.write("\x1b");
yttej.write("\x5b");
yttej.write("1;2;3aqwer");
