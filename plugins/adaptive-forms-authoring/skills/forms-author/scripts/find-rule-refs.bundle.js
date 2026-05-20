#!/usr/bin/env node
var __import_meta_url__ = require("url").pathToFileURL(__filename).href;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// stub:./parsers/CustomFunctionParser.js
var require_CustomFunctionParser = __commonJS({
  "stub:./parsers/CustomFunctionParser.js"(exports2, module2) {
    module2.exports = {};
  }
});

// src/find-rule-refs.js
var import_fs = require("fs");

// node_modules/@aemforms/rule-editor-transformer/src/transformers/FieldTransformer.js
var FD_KEY_TO_EVENT = {
  "fd:click": "Click",
  "fd:init": "Initialize",
  "fd:valueCommit": "Value Commit",
  "fd:enabled": "Enabled",
  "fd:validate": "Validate",
  "fd:format": "Format",
  "fd:calc": "Calculate",
  "fd:visible": "Visibility",
  "fd:options": "Options",
  "fd:submitSuccess": "Successful Submission",
  "fd:submitError": "Error in Submission"
};
var RULE_AST_KEYS = Object.keys(FD_KEY_TO_EVENT);

// node_modules/@aemforms/rule-editor-transformer/src/index.js
var CustomFunctionParser = __toESM(require_CustomFunctionParser(), 1);

// lib/content-model-walk.js
function sortedValues(itemsObj) {
  if (!itemsObj || typeof itemsObj !== "object") return [];
  return Object.entries(itemsObj).sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10)).map(([idx, entry]) => ({ idx, entry }));
}
function findFormRoot(contentModel2) {
  const top = sortedValues(contentModel2.items || {});
  const found = top.find(({ entry: e }) => e.properties?.fieldType === "form") || top[0];
  return found ? found.entry : null;
}
function walkItems(itemsObj, parentQualifiedId, parentCapiKey, parentPointer, depth, visitor) {
  for (const { idx, entry } of sortedValues(itemsObj)) {
    const name = entry.properties?.name || entry.id || "";
    const qualifiedId2 = parentQualifiedId ? `${parentQualifiedId}.${name}` : name;
    const capiKey = parentCapiKey ? `${parentCapiKey}:${idx}` : idx;
    const pointer = `${parentPointer}/items/${idx}`;
    visitor(entry, { name, qualifiedId: qualifiedId2, capiKey, pointer, depth });
    walkItems(entry.items || {}, qualifiedId2, capiKey, pointer, depth + 1, visitor);
  }
}

// src/find-rule-refs.js
function findFdRulesChild(itemsObj) {
  if (!itemsObj || typeof itemsObj !== "object") return null;
  for (const val of Object.values(itemsObj)) {
    if (val.id === "fd:rules" || val.componentType === "fd:rules") return val;
  }
  return null;
}
function hasComponentRef(node, targetId) {
  if (!node || typeof node !== "object") return false;
  if (["COMPONENT", "AFCOMPONENT", "VALUE_FIELD"].includes(node.nodeName) && node.id === targetId) return true;
  for (const val of Object.values(node)) {
    if (Array.isArray(val)) {
      for (const item of val) {
        if (hasComponentRef(item, targetId)) return true;
      }
    } else if (typeof val === "object" && val !== null) {
      if (hasComponentRef(val, targetId)) return true;
    }
  }
  return false;
}
function findRuleRefs(contentModel2, targetQualifiedId) {
  const formRoot = findFormRoot(contentModel2);
  if (!formRoot) return { refs: [], total: 0 };
  const formRootCapiKey = formRoot["capi-key"] || "0";
  const formRootPointer = formRootCapiKey.split(":").map((s) => `/items/${s}`).join("");
  const refs = [];
  walkItems(formRoot.items || {}, "$form", formRootCapiKey, formRootPointer, 1, (entry, ctx) => {
    const rulesNode = findFdRulesChild(entry.items);
    if (!rulesNode) return;
    const ruleSource = rulesNode.properties || rulesNode;
    for (const fdKey of RULE_AST_KEYS) {
      const astArray = ruleSource[fdKey];
      if (!Array.isArray(astArray) || astArray.length === 0) continue;
      let ast;
      try {
        ast = JSON.parse(astArray[0]);
      } catch {
        continue;
      }
      if (hasComponentRef(ast, targetQualifiedId)) {
        const capiKey = entry["capi-key"] || ctx.capiKey;
        refs.push({
          fieldName: ctx.name,
          capiKey,
          pointer: capiKey.split(":").map((s) => `/items/${s}`).join(""),
          fdKey
        });
      }
    }
  });
  return { refs, total: refs.length };
}
var args = process.argv.slice(2);
var get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : void 0;
};
var contentModelJson = get("--content-model");
var contentModelFile = get("--content-model-file");
var qualifiedId = get("--qualified-id");
if (!contentModelJson && !contentModelFile || !qualifiedId) {
  process.stderr.write(
    "Usage: node find-rule-refs.bundle.js --content-model <json> --qualified-id <id>\n       node find-rule-refs.bundle.js --content-model-file <path> --qualified-id <id>\n"
  );
  process.exit(2);
}
var contentModel;
try {
  const isFilePath = (s) => typeof s === "string" && (s.startsWith("/") || s.startsWith("./") || s.startsWith("~/"));
  const raw = contentModelJson && !isFilePath(contentModelJson) ? contentModelJson : (0, import_fs.readFileSync)(contentModelFile || contentModelJson, "utf8");
  const parsed = JSON.parse(raw);
  contentModel = parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
} catch (err) {
  process.stderr.write("Error: could not parse content model: " + err.message + "\n");
  process.exit(1);
}
var result = findRuleRefs(contentModel, qualifiedId);
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(0);
