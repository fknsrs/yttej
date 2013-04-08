#!/usr/bin/env node

var Yttej = require("./index");

var yttej = new Yttej();

yttej.on("data", console.log.bind(console));

yttej.write("asdfqwer");
yttej.write(Buffer([0x1b]));
yttej.write(Buffer([0x5b]));
yttej.write("1;2;3aqwer");
