#!/usr/bin/env node
"use strict";

function parseArgs(argv) {
  var args = argv.slice(2);
  var get = function(flag) {
    var i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  return { oldJson: get("--old"), newJson: get("--new") };
}

var parsed = parseArgs(process.argv);
var oldJson = parsed.oldJson;
var newJson = parsed.newJson;

if (!oldJson || !newJson) {
  console.error("Usage: node diff-component.bundle.js --old '<json>' --new '<json>'");
  process.exit(2);
}

var oldComp, newComp;
try {
  oldComp = JSON.parse(oldJson);
  newComp = JSON.parse(newJson);
} catch (e) {
  console.error("Invalid JSON: " + e.message);
  process.exit(2);
}

var ops = [];
var oldProps = oldComp.properties || {};
var newProps = newComp.properties || {};

for (var key of Object.keys(newProps)) {
  if (JSON.stringify(oldProps[key]) !== JSON.stringify(newProps[key])) {
    var op = key in oldProps ? "replace" : "add";
    ops.push({ op: op, path: "/properties/" + key, value: newProps[key] });
  }
}

for (var key2 of Object.keys(oldProps)) {
  if (!(key2 in newProps)) {
    ops.push({ op: "remove", path: "/properties/" + key2 });
  }
}

console.log(JSON.stringify(ops, null, 2));
process.exit(0);
