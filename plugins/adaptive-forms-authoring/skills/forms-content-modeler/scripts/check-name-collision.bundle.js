#!/usr/bin/env node
"use strict";

var fs = require("fs");

function parseArgs(argv) {
  var args = argv.slice(2);
  var get = function(flag) {
    var i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  return {
    contentModelFile: get("--content-model-file"),
    namesArg: get("--names"),
  };
}

function collectExistingNames(items, result) {
  for (var entry of Object.values(items || {})) {
    var name = entry.properties && entry.properties.name;
    var capiKey = entry["capi-key"];
    var pointer = capiKey
      ? capiKey.split(":").map(function(s) { return "/items/" + s; }).join("")
      : null;
    if (name) result.push({ name: name, pointer: pointer });
    if (entry.items && Object.keys(entry.items).length > 0) {
      collectExistingNames(entry.items, result);
    }
  }
}

var { contentModelFile, namesArg } = parseArgs(process.argv);

if (!contentModelFile || !namesArg) {
  console.error("Usage: node check-name-collision.bundle.js --content-model-file <path> --names 'name1,name2,...'");
  process.exit(2);
}

var contentModel;
try {
  contentModel = JSON.parse(fs.readFileSync(contentModelFile, "utf8"));
} catch (e) {
  console.error("Failed to read content model: " + e.message);
  process.exit(2);
}

var proposedNames = namesArg.split(",").map(function(n) { return n.trim(); }).filter(Boolean);

var existing = [];
collectExistingNames(contentModel.items, existing);
var existingMap = {};
for (var e of existing) existingMap[e.name] = e.pointer;

// Check each proposed name against existing model
var collisions = [];
for (var name of proposedNames) {
  if (existingMap[name] !== undefined) {
    collisions.push({ name: name, existingPath: existingMap[name] });
  }
}

// Check intra-batch duplicates
var seen = {};
var intraBatch = [];
for (var n of proposedNames) {
  if (seen[n]) {
    intraBatch.push({ a: n, b: n });
  }
  seen[n] = true;
}

var result = { collisions: collisions, intraBatch: intraBatch };
console.log(JSON.stringify(result, null, 2));
process.exit(collisions.length > 0 || intraBatch.length > 0 ? 1 : 0);
