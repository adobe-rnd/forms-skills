#!/usr/bin/env node
var __import_meta_url__ = require('url').pathToFileURL(__filename).href;

// node_modules/@aemforms/rule-editor-transformer/src/cli/parse-functions.js
var import_fs2 = require("fs");

// node_modules/@aemforms/rule-editor-transformer/src/parsers/CustomFunctionParser.js
var import_fs = require("fs");
var import_vm = require("vm");
var import_url = require("url");
var import_path = require("path");
var __filename = (0, import_url.fileURLToPath)(__import_meta_url__);
var __dirname = (0, import_path.dirname)(__filename);
function loadParser() {
  const parserPath = (0, import_path.join)(__dirname, "vendor/custom-function-parser.js");
  const code = (0, import_fs.readFileSync)(parserPath, "utf-8");
  const sandbox = { module: { exports: {} }, exports: {} };
  sandbox.module.exports = sandbox.exports;
  sandbox.globalThis = sandbox;
  sandbox.global = sandbox;
  sandbox.self = sandbox;
  const ctx = (0, import_vm.createContext)(sandbox);
  new import_vm.Script(code, { filename: parserPath }).runInContext(ctx);
  return sandbox.module.exports;
}
var parser = loadParser();
function parse(code) {
  return parser.parse(code);
}
function extractStaticImports(code) {
  if (typeof parser.extractStaticImports === "function") {
    return parser.extractStaticImports(code) || [];
  }
  return [];
}

// node_modules/@aemforms/rule-editor-transformer/src/cli/parse-functions.js
function readInput(args) {
  const stdinIdx = args.indexOf("--stdin");
  if (stdinIdx !== -1) {
    return (0, import_fs2.readFileSync)(0, "utf8");
  }
  const filePath = args.find((a) => !a.startsWith("--"));
  if (!filePath) {
    throw new Error("Usage: parse-functions.js <functions.js> | --stdin");
  }
  return (0, import_fs2.readFileSync)(filePath, "utf8");
}
try {
  const code = readInput(process.argv.slice(2));
  const parsed = parse(code);
  const imports = extractStaticImports(code);
  process.stdout.write(`${JSON.stringify({
    success: true,
    customFunction: parsed.customFunction || [],
    imports: imports || []
  })}
`);
  process.exit(0);
} catch (e) {
  process.stdout.write(`${JSON.stringify({ success: false, error: e.message })}
`);
  process.exit(1);
}
