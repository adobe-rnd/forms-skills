#!/usr/bin/env node
"use strict";

// resolve-component-type.js
// Returns all AEM componentTypes that match a given fieldType value.
//
// Why this exists:
//   Hard-coding componentType suffixes in field-types.md is fragile — the definition is the
//   authoritative source. Each componentDefinition has a "./fieldType" field whose options list
//   the fieldType value it supports. Multiple componentTypes can share the same fieldType
//   (e.g. "button" → submit/reset/generic; "checkbox" → checkbox/switch).
//
// The caller picks the right candidate by matching candidate title against user intent.
// With one candidate, use it directly. With multiple, pick by title.
//
// Output: { candidates: [{ componentType, normalized, title }, ...] }
// Exit 0 = one or more candidates found, Exit 1 = no match, Exit 2 = bad args.

var fs = require("fs");

function parseArgs(argv) {
  var args = argv.slice(2);
  var get = function(flag) {
    var i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  return {
    definitionFile: get("--definition-file"),
    definitionJson: get("--definition"),
    fieldType: get("--field-type"),
  };
}

function parseDefinition(definitionFile, definitionJson) {
  if (definitionFile) {
    var raw = fs.readFileSync(definitionFile, "utf8").trim();
    var data = JSON.parse(raw);
    if (Array.isArray(data)) {
      // MCP tool-result wrapper: [{type: "text", text: "...JSON:\n{...}"}]
      var text = data[0].text;
      var marker = "JSON:\n";
      var jsonStart = text.indexOf(marker);
      if (jsonStart !== -1) {
        return JSON.parse(text.slice(jsonStart + marker.length));
      }
      // Fallback: no JSON: marker — find first '{' (header-only prefix)
      var braceStart = text.indexOf("{");
      if (braceStart !== -1) {
        return JSON.parse(text.slice(braceStart));
      }
      throw new Error("Could not find JSON content in definition file — unexpected format");
    } else {
      // Raw definition JSON object — pass through directly
      return data;
    }
  }
  return JSON.parse(definitionJson);
}

function normalize(ct) {
  return ct.replace(/^\/apps\//, "");
}

function resolveComponentType(definition, fieldType) {
  var defs = definition.componentDefinitions || [];

  var candidates = defs.filter(function(cd) {
    var fields = cd.fields || [];
    var ftField = fields.find(function(f) { return f.name === "./fieldType"; });
    if (!ftField) return false;
    var options = ftField.options || [];
    return options.some(function(o) { return o.value === fieldType; });
  });

  return candidates.map(function(cd) {
    return {
      componentType: cd.componentType,
      normalized: normalize(cd.componentType || ""),
      title: cd.title || "",
    };
  });
}

var parsed = parseArgs(process.argv);

if ((!parsed.definitionFile && !parsed.definitionJson) || !parsed.fieldType) {
  console.error(
    "Usage: node resolve-component-type.bundle.js (--definition-file <path> | --definition '<json>') --field-type <value>"
  );
  console.error("");
  console.error("  --definition-file  Path to MCP tool-result file (raw or filtered)");
  console.error("  --definition       Inline definition JSON");
  console.error("  --field-type       The AEM fieldType value (e.g. text-input, button, tel)");
  console.error("");
  console.error("Example:");
  console.error("  node resolve-component-type.bundle.js \\");
  console.error("    --definition-file /path/to/definition.txt \\");
  console.error("    --field-type button");
  process.exit(2);
}

var definition;
try {
  definition = parseDefinition(parsed.definitionFile, parsed.definitionJson);
} catch (e) {
  console.error("Failed to parse definition: " + e.message);
  process.exit(2);
}

var candidates = resolveComponentType(definition, parsed.fieldType);

if (candidates.length === 0) {
  console.error("No componentDefinition found with fieldType: " + parsed.fieldType);
  console.error("Available fieldTypes in definition:");
  var allFt = {};
  (definition.componentDefinitions || []).forEach(function(cd) {
    var ftField = (cd.fields || []).find(function(f) { return f.name === "./fieldType"; });
    if (ftField) {
      (ftField.options || []).forEach(function(o) { allFt[o.value] = true; });
    }
  });
  Object.keys(allFt).sort().forEach(function(ft) { console.error("  " + ft); });
  process.exit(1);
}

console.log(JSON.stringify({ candidates: candidates }, null, 2));
process.exit(0);
